'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useIframeSdk } from '@whop/react';
import { fallbackCounter } from '@/lib/fallback-counter';

interface PaymentFormProps {
  planId: string;
  planName: string;
  price: number;
  interval: string;
  userId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface SavedPaymentMethod {
  id: string;
  type: 'card';
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
}

export default function PaymentForm({ planId, planName, price, interval, userId, onSuccess, onCancel }: PaymentFormProps) {
  const iframeSdk = useIframeSdk();
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string>();
  
  // Load saved payment methods from Whop API
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await fetch(`/api/payment-methods?userId=${userId}`);
        if (response.ok) {
          const methods = await response.json();
          setSavedMethods(methods);
          console.log('Loaded payment methods:', methods);
        } else {
          console.error('Failed to load payment methods');
          setSavedMethods([]);
        }
      } catch (error) {
        console.error('Error loading payment methods:', error);
        setSavedMethods([]);
      }
    };

    loadPaymentMethods();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create checkout session with Whop
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/cancel`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create charge');
      }

      const { inAppPurchase } = await response.json();
      
      // 2. Open payment modal using Whop iframe SDK
      const res = await iframeSdk.inAppPurchase(inAppPurchase);
      
      if (res.status === "ok") {
        setReceiptId(res.data.receiptId);
        setError(null);
        onSuccess();
      } else {
        setReceiptId(undefined);
        setError(res.error || 'Payment failed');
      }
      
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCardIcon = (brand: string) => {
    switch (brand) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      default: return '💳';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
            <p className="text-sm text-gray-600">{planName} - ${price}/{interval}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Saved Payment Methods */}
          {savedMethods.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Saved Payment Methods</h3>
              <div className="space-y-2">
                {savedMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedMethod === method.id}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCardIcon(method.brand)}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last4}
                        </div>
                        <div className="text-sm text-gray-500">
                          Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                        </div>
                      </div>
                    </div>
                    {selectedMethod === method.id && (
                      <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* New Payment Method Option */}
          <label
            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedMethod === 'new'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="new"
              checked={selectedMethod === 'new'}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="sr-only"
            />
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Add New Payment Method</div>
                <div className="text-sm text-gray-500">Enter a new card</div>
              </div>
            </div>
            {selectedMethod === 'new' && (
              <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />
            )}
          </label>

          {/* New Card Form */}
          {selectedMethod === 'new' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={19}
                  />
                  <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVC
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={4}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                `Pay $${price}/${interval}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
