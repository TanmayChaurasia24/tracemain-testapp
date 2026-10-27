import { Router, Request, Response } from 'express';

export const cartRouter = Router();

type CartItem = {
  price: number;
  quantity: number;
};

type CalculateCartRequest = {
  items: CartItem[];
  discountCode?: string | null;
};

cartRouter.post('/calculate', (req: Request<{}, {}, CalculateCartRequest>, res: Response): void => {
  const { items, discountCode } = req.body;

  if (!items || !Array.isArray(items)) {
    res.status(400).json({ error: 'Valid items array is required.' });
    return;
  }

  let subtotal = 0;
  for (const item of items) {
    if (typeof item.price !== 'number' || typeof item.quantity !== 'number') {
      res.status(400).json({ error: 'Item price and quantity must be numbers.' });
      return;
    }
    subtotal += item.price * item.quantity;
  }

  let discountAmount = 0;
  let errorMessage: string | undefined = undefined;

  if (discountCode) {
    if (discountCode === 'SAVE20') {
      discountAmount = subtotal * 0.20;
    } else if (discountCode === 'HALFOFF') {
      discountAmount = subtotal * 0.50;
    } else {
      errorMessage = 'Invalid discount code';
    }
  }

  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * 0.10;
  const total = discountedSubtotal + tax;

  const responsePayload: any = {
    subtotal,
    discountAmount,
    tax,
    total
  };

  if (errorMessage) {
    responsePayload.error = errorMessage;
  }

  res.status(200).json(responsePayload);
});

type ApplyCouponRequest = {
  cartTotal: number;
  couponCode: string;
};

cartRouter.post('/apply-coupon', (req: Request<{}, {}, ApplyCouponRequest>, res: Response): void => {
  const { cartTotal, couponCode } = req.body;

  if (typeof cartTotal !== 'number' || !Number.isFinite(cartTotal) || cartTotal <= 0) {
    res.status(400).json({ error: 'cartTotal must be a number greater than 0.' });
    return;
  }

  if (!couponCode || typeof couponCode !== 'string') {
    res.status(400).json({ error: 'Invalid or expired coupon code.' });
    return;
  }

  const upperCode = couponCode.trim().toUpperCase();

  if (upperCode === 'SAVE10') {
    const discount = Number((cartTotal * 0.10).toFixed(2));
    const finalTotal = Number((cartTotal - discount).toFixed(2));
    res.status(200).json({
      valid: true,
      code: 'SAVE10',
      discount,
      finalTotal,
    });
    return;
  }

  if (upperCode === 'FLAT20') {
    if (cartTotal < 50) {
      res.status(400).json({ error: 'Minimum cartTotal of $50 required for FLAT20 coupon.' });
      return;
    }
    const discount = 20;
    const finalTotal = Number((cartTotal - discount).toFixed(2));
    res.status(200).json({
      valid: true,
      code: 'FLAT20',
      discount,
      finalTotal,
    });
    return;
  }

  if (upperCode === 'FREESHIP') {
    const discount = 5;
    const finalTotal = Math.max(0, Number((cartTotal - discount).toFixed(2)));
    res.status(200).json({
      valid: true,
      code: 'FREESHIP',
      discount,
      finalTotal,
    });
    return;
  }

  res.status(400).json({ error: 'Invalid or expired coupon code.' });
});

