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
