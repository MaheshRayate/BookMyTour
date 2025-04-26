import axios from "axios";
import "@babel/polyfill";
import { showAlert } from "./alerts";

export const login = async (email, password) => {
  console.log(email, password);
  try {
    const res = await axios({
      method: "POST",
      url: "http://localhost:3000/api/v1/users/login",
      data: {
        email,
        password,
      },
    });

    // After logging in we need to show alert and redirect to home page after 1.5 sec
    if (res.data.status === "success") {
      showAlert("success", "Logged in Succesfully!");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }

    console.log(res);
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "http://localhost:3000/api/v1/users/logout",
    });

    if (res.data.status === "success") {
      location.reload(true); //for reloading the page by the server and not from the browsers cache
    }
  } catch (err) {
    showAlert("error", "Error Logging Out! Try Again!");
  }
};
