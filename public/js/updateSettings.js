import axios from "axios";
import { showAlert } from "./alerts";

// This function will update both data and password
// if type is data then update only name and email
// if type is password then update password
// type will be 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === "password"
        ? "http://localhost:3000/api/v1/users/updateMyPassword"
        : "http://localhost:3000/api/v1/users/updateMe";

    const res = await axios({
      method: "PATCH",
      url,
      data,
    });

    if (res.data.status === "success") {
      showAlert("success", `${type.toUpperCase()} updated succesfully!`);
      window.setTimeout(() => {
        location.assign("/me");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
