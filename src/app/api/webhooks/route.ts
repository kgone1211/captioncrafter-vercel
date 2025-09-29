import { waitUntil } from "@vercel/functions";
import { makeWebhookValidator } from "@whop/api";
import type { NextRequest } from "next/server";
import { fallbackCounter } from "@/lib/fallback-counter";
import { subscriptionManager } from "@/lib/subscription-manager";
import { db } from "@/lib/db";

const validateWebhook = makeWebhookValidator({
	webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

export async function POST(request: NextRequest): Promise<Response> {
	// Validate the webhook to ensure it's from Whop
	const webhookData = await validateWebhook(request);

	console.log('Webhook received:', webhookData.action, webhookData.data);

	// Handle the webhook event
	if (webhookData.action === "payment.succeeded") {
		const { id, final_amount, amount_after_fees, currency, user_id } =
			webhookData.data;

		// final_amount is the amount the user paid
		// amount_after_fees is the amount that is received by you, after card fees and processing fees are taken out

		console.log(
			`Payment ${id} succeeded for ${user_id} with amount ${final_amount} ${currency}`,
		);

		// if you need to do work that takes a long time, use waitUntil to run it in the background
		waitUntil(
			handlePaymentSuccess(
				user_id,
				final_amount,
				currency,
				amount_after_fees,
			),
		);
	}

	// Handle membership events (Whop uses "membership" instead of "subscription")
	if (webhookData.action === "membership.went_valid" || webhookData.action === "membership.went_invalid") {
		const { user_id, plan_id, status } = webhookData.data;
		
		console.log(`Membership ${webhookData.action} for user ${user_id}, plan ${plan_id}, status ${status}`);
		
		waitUntil(
			handleMembershipUpdate(user_id, plan_id, status)
		);
	}

	// Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
	return new Response("OK", { status: 200 });
}

async function handlePaymentSuccess(
	user_id: string | null | undefined,
	amount: number,
	currency: string,
	amount_after_fees: number | null | undefined,
) {
	if (!user_id) {
		console.error('No user_id provided in payment webhook');
		return;
	}

	try {
		// Convert user_id to number for fallback counter
		const userIdNum = parseInt(user_id);
		if (isNaN(userIdNum)) {
			console.error('Invalid user_id format:', user_id);
			return;
		}

		// Create proper subscription with billing cycle
		await subscriptionManager.createSubscription(
			userIdNum,
			'premium', // Default plan
			'monthly', // Default billing cycle
			undefined, // paymentMethodId - would come from Whop
			undefined  // whopSubscriptionId - would come from Whop
		);

		// Also update fallback counter for immediate access
		fallbackCounter.upgradeToSubscription(userIdNum, 'premium');
		
		console.log(`User ${userIdNum} upgraded to premium subscription with recurring billing after payment`);
		
		// Here you could also:
		// - Send confirmation emails
		// - Log analytics events
		// - Update external systems
		
	} catch (error) {
		console.error('Error handling payment success:', error);
	}
}

async function handleMembershipUpdate(
	user_id: string | null | undefined,
	plan_id: string | null | undefined,
	status: string | null | undefined,
) {
	if (!user_id) {
		console.error('No user_id provided in membership webhook');
		return;
	}

	try {
		const userIdNum = parseInt(user_id);
		if (isNaN(userIdNum)) {
			console.error('Invalid user_id format:', user_id);
			return;
		}

		if (status === 'active' || status === 'valid') {
			// Create or renew subscription
			await subscriptionManager.createSubscription(
				userIdNum,
				plan_id || 'premium',
				'monthly', // Default billing cycle
				undefined, // paymentMethodId
				undefined  // whopSubscriptionId
			);
			
			// Also update fallback counter
			fallbackCounter.upgradeToSubscription(userIdNum, plan_id || 'premium');
			console.log(`User ${userIdNum} membership activated with recurring billing`);
		} else {
			// Cancel subscription
			await subscriptionManager.cancelSubscription(userIdNum);
			fallbackCounter.downgradeToFree(userIdNum);
			console.log(`User ${userIdNum} membership deactivated`);
		}
		
	} catch (error) {
		console.error('Error handling membership update:', error);
	}
}
