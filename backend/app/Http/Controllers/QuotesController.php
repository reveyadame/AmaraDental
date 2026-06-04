<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Quotes\ConvertQuoteRequest;
use App\Http\Requests\Quotes\StoreQuoteRequest;
use App\Http\Requests\Quotes\UpdateQuoteRequest;
use App\Http\Resources\ChargeResource;
use App\Http\Resources\QuoteResource;
use App\Models\CashSession;
use App\Models\Charge;
use App\Models\Discount;
use App\Models\Quote;
use App\Models\Specialist;
use App\Models\Treatment;
use App\Support\CommissionResolver;
use App\Support\RecallGenerator;
use App\Support\TenantContext;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuotesController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Quote::class);

        $quotes = Quote::query()
            ->with(['patient', 'createdBy'])
            ->when($request->filled('status'),
                fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('patient_id'),
                fn ($q) => $q->where('patient_id', $request->integer('patient_id')))
            ->when($request->filled('date_from'),
                fn ($q) => $q->whereDate('created_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'),
                fn ($q) => $q->whereDate('created_at', '<=', $request->date('date_to')))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 25));

        return response()->json([
            'data' => QuoteResource::collection($quotes->items()),
            'meta' => [
                'current_page' => $quotes->currentPage(),
                'last_page' => $quotes->lastPage(),
                'per_page' => $quotes->perPage(),
                'total' => $quotes->total(),
            ],
        ]);
    }

    public function show(Quote $quote): JsonResponse
    {
        $this->authorize('view', $quote);

        $quote->load(['patient', 'createdBy', 'items', 'convertedCharge']);

        return response()->json(['data' => QuoteResource::make($quote)]);
    }

    public function store(StoreQuoteRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $tenantId = TenantContext::tenantId();

        $quote = DB::transaction(function () use ($request, $userId, $tenantId): Quote {
            /** @var Quote $quote */
            $quote = Quote::query()->create([
                'tenant_id' => $tenantId,
                'patient_id' => $request->integer('patient_id'),
                'created_by_user_id' => $userId,
                'notes' => $request->input('notes'),
                'valid_until' => $request->input('valid_until'),
                'status' => 'draft',
            ]);

            foreach ($request->input('items', []) as $row) {
                $this->createQuoteItem($quote, $row);
            }

            $quote->recomputeTotals();
            $quote->code = sprintf('COT-%04d', $quote->id);
            $quote->save();

            return $quote;
        });

        $quote->load(['patient', 'createdBy', 'items']);

        return response()->json(['data' => QuoteResource::make($quote)], 201);
    }

    public function update(UpdateQuoteRequest $request, Quote $quote): JsonResponse
    {
        // La policy ya verifica que sea editable.
        DB::transaction(function () use ($request, $quote): void {
            $quote->update([
                'notes' => $request->input('notes'),
                'valid_until' => $request->input('valid_until'),
            ]);

            // Reemplazo total de items: la edición es destructiva, mucho más
            // simple que tratar de hacer diff y matchear ids.
            $quote->items()->delete();

            foreach ($request->input('items', []) as $row) {
                $this->createQuoteItem($quote, $row);
            }

            $quote->recomputeTotals();
            $quote->save();
        });

        $quote->refresh()->load(['patient', 'createdBy', 'items']);

        return response()->json(['data' => QuoteResource::make($quote)]);
    }

    public function destroy(Request $request, Quote $quote): JsonResponse
    {
        $this->authorize('delete', $quote);

        // Si ya se convirtió en cobro, NO eliminamos la relación con el
        // cobro — el cobro queda intacto, solo dejamos huérfano el
        // converted_charge_id si se restaura la quote más adelante.
        $quote->delete();

        return response()->json(null, 204);
    }

    public function markSent(Request $request, Quote $quote): JsonResponse
    {
        $this->authorize('update', $quote);

        abort_if($quote->status === 'converted', 422, 'La cotización ya fue convertida en cobro.');

        $quote->update([
            'status' => 'sent',
            'sent_at' => $quote->sent_at ?? now(),
        ]);

        $quote->load(['patient', 'createdBy', 'items']);

        return response()->json(['data' => QuoteResource::make($quote)]);
    }

    public function markAccepted(Request $request, Quote $quote): JsonResponse
    {
        $this->authorize('update', $quote);

        abort_if($quote->status === 'converted', 422, 'La cotización ya fue convertida en cobro.');

        $quote->update([
            'status' => 'accepted',
            'accepted_at' => now(),
            'rejected_at' => null,
        ]);

        $quote->load(['patient', 'createdBy', 'items']);

        return response()->json(['data' => QuoteResource::make($quote)]);
    }

    public function markRejected(Request $request, Quote $quote): JsonResponse
    {
        $this->authorize('update', $quote);

        abort_if($quote->status === 'converted', 422, 'La cotización ya fue convertida en cobro.');

        $quote->update([
            'status' => 'rejected',
            'rejected_at' => now(),
        ]);

        $quote->load(['patient', 'createdBy', 'items']);

        return response()->json(['data' => QuoteResource::make($quote)]);
    }

    /**
     * Reabre una cotización rechazada para volverla a editar.
     */
    public function reopen(Request $request, Quote $quote): JsonResponse
    {
        $this->authorize('update', $quote);

        abort_if($quote->status === 'converted', 422, 'La cotización ya fue convertida en cobro.');
        abort_if($quote->status !== 'rejected', 422, 'Solo se pueden reabrir cotizaciones rechazadas.');

        $quote->update([
            'status' => 'draft',
            'rejected_at' => null,
        ]);

        $quote->load(['patient', 'createdBy', 'items']);

        return response()->json(['data' => QuoteResource::make($quote)]);
    }

    /**
     * Convierte la cotización en un cobro. Copia los items tal cual (con
     * sus precios efectivos al momento de cotizar, no los del catálogo
     * actual) y opcionalmente registra pagos iniciales.
     */
    public function convertToCharge(ConvertQuoteRequest $request, Quote $quote): JsonResponse
    {
        if ($quote->status === 'converted') {
            throw ValidationException::withMessages([
                'quote' => 'La cotización ya fue convertida en cobro.',
            ]);
        }

        // En cobros el especialista es obligatorio (queremos saber quién
        // atendió). Si la cotización tiene items sin especialista, hay que
        // editarla y completarla antes de convertir.
        $quote->loadMissing('items');
        $missing = $quote->items->whereNull('specialist_id');
        if ($missing->isNotEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'Asigna un especialista a cada tratamiento antes de convertir la cotización en cobro.',
            ]);
        }

        $userId = $request->user()->id;
        $tenantId = TenantContext::tenantId();

        // Si vienen pagos iniciales, necesitamos sesión de caja abierta.
        $session = null;
        if (! empty($request->input('payments'))) {
            $session = CashSession::query()->where('status', 'open')->first();
            abort_if(! $session, 422,
                'No hay una caja abierta. Abre la caja del día antes de registrar pagos.');
        }

        $charge = DB::transaction(function () use ($request, $quote, $session, $userId, $tenantId): Charge {
            $quote->load('items');

            /** @var Charge $charge */
            $charge = Charge::query()->create([
                'tenant_id' => $tenantId,
                'patient_id' => $quote->patient_id,
                'created_by_user_id' => $userId,
                'notes' => $request->input('notes') ?: ($quote->code
                    ? "Generado desde cotización {$quote->code}"
                    : null),
                'status' => 'pending',
            ]);

            // Recalcular comisión al convertir — la cotización no la guarda,
            // y los porcentajes vigentes del especialista pueden haber
            // cambiado desde que se emitió.
            foreach ($quote->items as $qi) {
                $treatment = $qi->treatment_id
                    ? Treatment::query()->find($qi->treatment_id)
                    : null;
                $specialist = $qi->specialist_id
                    ? Specialist::query()->find($qi->specialist_id)
                    : null;

                $commissionPercent = $treatment
                    ? CommissionResolver::resolve($specialist, $treatment)
                    : null;
                $commissionBase = $treatment ? $treatment->commission_base : 'price';
                $commissionCost = $treatment && $treatment->commission_base === 'profit'
                    ? (float) $treatment->cost : 0;
                $commissionBaseAmount = $treatment
                    ? CommissionResolver::baseAmount($treatment, (float) $qi->line_total, (int) $qi->quantity)
                    : (float) $qi->line_total;
                $commissionAmount = $commissionPercent !== null
                    ? round($commissionBaseAmount * ($commissionPercent / 100), 2)
                    : 0;

                $charge->items()->create([
                    'tenant_id' => $tenantId,
                    'treatment_id' => $qi->treatment_id,
                    'treatment_name' => $qi->treatment_name,
                    'treatment_code' => $qi->treatment_code,
                    'specialist_id' => $qi->specialist_id,
                    'specialist_name' => $qi->specialist_name,
                    'quantity' => $qi->quantity,
                    'unit_price' => $qi->unit_price,
                    'discount_id' => $qi->discount_id,
                    'discount_amount' => $qi->discount_amount,
                    'line_total' => $qi->line_total,
                    'commission_percent' => $commissionPercent,
                    'commission_base' => $commissionBase,
                    'commission_cost' => $commissionCost,
                    'commission_amount' => $commissionAmount,
                ]);
            }

            foreach ($request->input('payments', []) as $p) {
                $charge->payments()->create([
                    'tenant_id' => $tenantId,
                    'cash_session_id' => $session->id,
                    'user_id' => $userId,
                    'method' => $p['method'],
                    'amount' => $p['amount'],
                    'paid_at' => now(),
                    'reference' => $p['reference'] ?? null,
                    'notes' => $p['notes'] ?? null,
                ]);
            }

            $charge->recomputeTotals();
            $charge->code = sprintf('CHG-%04d', $charge->id);
            $charge->save();

            if ($charge->status === 'paid') {
                RecallGenerator::fromCharge($charge);
            }

            $quote->update([
                'status' => 'converted',
                'converted_at' => now(),
                'converted_charge_id' => $charge->id,
                // Si no estaba aceptada, asumimos aceptación implícita al convertir.
                'accepted_at' => $quote->accepted_at ?? now(),
            ]);

            return $charge;
        });

        $charge->load(['patient', 'createdBy', 'items', 'payments.user']);

        return response()->json([
            'data' => [
                'quote' => QuoteResource::make($quote->fresh(['patient', 'createdBy', 'items'])),
                'charge' => ChargeResource::make($charge),
            ],
        ], 201);
    }

    /**
     * Crea un quote_item resolviendo precio y descuento. No calcula comisión
     * — eso se hace en el momento de convertir a cobro.
     */
    private function createQuoteItem(Quote $quote, array $row): void
    {
        /** @var Treatment $treatment */
        $treatment = Treatment::query()->findOrFail($row['treatment_id']);

        $specialist = null;
        if (! empty($row['specialist_id'])) {
            /** @var Specialist|null $specialist */
            $specialist = Specialist::query()->find($row['specialist_id']);
        }

        $quantity = (int) $row['quantity'];
        $override = $row['unit_price_override'] ?? null;
        $unitPrice = $override !== null
            ? (float) $override
            : (float) $treatment->base_price;

        $subtotal = round($unitPrice * $quantity, 2);

        $discountAmount = 0.0;
        $discount = null;
        if (! empty($row['discount_id'])) {
            /** @var Discount|null $discount */
            $discount = Discount::query()->find($row['discount_id']);
            if ($discount && $discount->active) {
                if ($discount->type === 'percent') {
                    $discountAmount = round($subtotal * ((float) $discount->value / 100), 2);
                } else {
                    $discountAmount = round((float) $discount->value, 2);
                }
                $discountAmount = min($discountAmount, $subtotal);
            }
        }

        $lineTotal = round($subtotal - $discountAmount, 2);

        $quote->items()->create([
            'tenant_id' => $quote->tenant_id,
            'treatment_id' => $treatment->id,
            'treatment_name' => $treatment->name,
            'treatment_code' => $treatment->code,
            'specialist_id' => $specialist?->id,
            'specialist_name' => $specialist?->name,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'discount_id' => $discount?->id,
            'discount_amount' => $discountAmount,
            'line_total' => $lineTotal,
        ]);
    }
}
