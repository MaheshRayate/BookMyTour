const stripe = Stripe(
  "pk_test_51RH0rQRqRVZb2gbZpS3kt8Clur7ktq65DT0QyiL6sUni2Z407WzFgCDCdaOudHDp18QSbf0o3hxn0XopaCGbUSbi00CfhCfOVR"
);
import axios from "axios";
import { showAlert } from "./alerts";

export const bookTour = async (tourId) => {
  try {
    //1) Get checkout session from API endpoint
    const session = await axios(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}/`
    );
    console.log(session);
    //2)Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
    
  } catch (err) {
    console.log(err);
    showAlert("error", err);
  }
};
