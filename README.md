# Parantha House — Android & iOS

A React Native + Expo breakfast ordering app for fresh Indian paranthas.

## Customer flow

- Browse the daily breakfast menu without creating an account.
- Add paranthas to the cart and enter a name, Indian mobile number, and delivery address at checkout.
- Pay using Google Pay's UPI payment handoff.
- Orders remain marked as pending merchant confirmation because a UPI app handoff does not provide verified payment status to this frontend-only app.

The sample menu includes Aloo Parantha as today's special, plus Paneer, Gobi, and Mooli paranthas. Menu prices are in INR.

## Run the app

```bash
npm install
npm start
```

Scan the Expo QR code with Expo Go on Android or iOS. For simulators, run `npm run android` or `npm run ios` with the required native development tools installed.

## Google Pay setup and production requirements

Checkout currently routes the UPI payment intent to `manjeetsaini297@okhdfcbank`. Verify that this UPI ID belongs to the merchant before accepting payments. Android targets the Google Pay app; iOS uses the Google Pay UPI URL scheme. The customer must have Google Pay installed.

This project has no order backend and cannot verify a payment, persist an order, or notify the restaurant. The app therefore never labels an order as paid. Before production, connect checkout to a trusted server and a payment provider/merchant integration that verifies payment server-side, saves orders, and confirms fulfilment. Do not rely on a customer tapping a confirmation button as proof of payment.
