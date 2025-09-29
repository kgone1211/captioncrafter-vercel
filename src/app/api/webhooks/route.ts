import { waitUntil } from "@vercel/functions";
import { makeWebhookValidator } from "@whop/api";
import type { NextRequest } from "next/server";
import { fallbackCounter } from "@/lib/fallback-counter";

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

	// Handle subscription events
	if (webhookData.action === "subscription.created" || webhookData.action === "subscription.updated") {
		const { user_id, plan_id, status } = webhookData.data;
		
		console.log(`Subscription ${webhookData.action} for user ${user_id}, plan ${plan_id}, status ${status}`);
		
		waitUntil(
			handleSubscriptionUpdate(user_id, plan_id, status)
		);
	}

	// Handle subscription cancellation
	if (webhookData.action === "subscription.cancelled") {
		const { user_id } = webhookData.data;
		
		console.log(`Subscription cancelled for user ${user_id}`);
		
		waitUntil(
			handleSubscriptionCancellation(user_id)
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

		// Upgrade user to subscription
		fallbackCounter.upgradeToSubscription(userIdNum, 'premium');
		
		console.log(`User ${userIdNum} upgraded to premium subscription after payment`);
		
		// Here you could also:
		// - Update database records
		// - Send confirmation emails
		// - Log analytics events
		// - Update external systems
		
	} catch (error) {
		console.error('Error handling payment success:', error);
	}
}

async function handleSubscriptionUpdate(
	user_id: string | null | undefined,
	plan_id: string | null | undefined,
	status: string | null | undefined,
) {
	if (!user_id) {
		console.error('No user_id provided in subscription webhook');
		return;
	}

	try {
		const userIdNum = parseInt(user_id);
		if (isNaN(userIdNum)) {
			console.error('Invalid user_id format:', user_id);
			return;
		}

		if (status === 'active') {
			fallbackCounter.upgradeToSubscription(userIdNum, plan_id || 'premium');
			console.log(`User ${userIdNum} subscription activated`);
		} else {
			fallbackCounter.downgradeToFree(userIdNum);
			console.log(`User ${userIdNum} subscription deactivated`);
		}
		
	} catch (error) {
		console.error('Error handling subscription update:', error);
	}
}

async function handleSubscriptionCancellation(
	user_id: string | null | undefined,
) {
	if (!user_id) {
		console.error('No user_id provided in subscription cancellation webhook');
		return;
	}

	try {
		const userIdNum = parseInt(user_id);
		if (isNaN(userIdNum)) {
			console.error('Invalid user_id format:', user_id);
			return;
		}

		fallbackCounter.downgradeToFree(userIdNum);
		console.log(`User ${userIdNum} subscription cancelled`);
		
	} catch (error) {
		console.error('Error handling subscription cancellation:', error);
	}
}
