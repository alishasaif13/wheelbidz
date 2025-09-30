import express from "express";
import {
  authenticateToken,
  isAdmin,
  isSeller,
  isMember,
} from "../middlewares/authMiddleware.js";
import {
  getuploadfile,
  login,
  registerBusinessMember,
  getRegisteredMembers,
  updateBusinessMember,
  deleteBusinessMember,
  getUsersById,
} from "../controllers/authController.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { addCalenderEvent } from "../controllers/calenderController.js";
import { sendAlert, getAlerts } from "../controllers/alertController.js";
import {
  addTransactionData,
  getTransactionData,
  updateTransactionData,
  deleteTransactionData,
  createPaymentIntent,
  fundDeposit,
  updateFundDeposit,
  getFundDeposit,
  addFundWithdrawl,
  updateFundWithdrawl,
  getFundWithdrawl,
} from "../controllers/paymentController.js";
import { addLocation } from "../controllers/locationController.js";
import {
  deleteSellerIndividuals,
  getSellerIndividuals,
  updateIndividual,
} from "../controllers/sellVehicle.js";
import {
  addAboutPageData,
  addHomePageData,
  deleteAboutPageData,
  deleteHomePage,
  getAboutPageData,
  getHomePageData,
  updateAboutPageData,
  updateHomePageData,
} from "../controllers/homePageController.js";
import {
  getContactUs,
  getPartner,
  getSuggestions,
} from "../controllers/contactUsController.js";
import {
  addVehiclePrices,
  addVehicleSpecs,
  deleteVehiclePrices,
  deleteVehicleSpecs,
  getVehiclePrices,
  updateVehiclePrices,
  updateVehicleSpecs,
} from "../controllers/featureSpecController.js";
import {
  autoUpdateToLive,
  bidStartEnd,
  updateBidStatusAdmin,
} from "../controllers/biddingController.js";
import {
  addBrands,
  addCity,
  addModel,
  addSeries,
  deleteBrand,
  deleteCity,
  deleteModel,
  deleteSereis,
  getBrandById,
  getBrands,
  getCitites,
  getCititesById,
  getModelById,
  getModels,
  getSeries,
  getSeriesById,
  updateBrands,
  updateCity,
  updateModel,
  updateSeries,
} from "../controllers/brandController.js";
import { uploadVehicleImages } from "../middlewares/uploadMiddleware2.js";
import {
  bidsForAdmin,
  bidsPlacedById,
  liveAuctionsForAdmin,
  purchasedVehicleData,
  upcomingAuctionsForAdmin,
} from "../controllers/bidReportingController.js";
import { checkVehicles } from "../controllers/vehicleController.js";
import passport from "passport";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(passport.initialize());

export default (app) => {
  app.get("/getuploadfile", getuploadfile);

  //Login:
  app.post("/login", login);

  app.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: "/login",
    }),
    (req, res) => {
      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);

      res.json({
        token: token,
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        image: req.user.image,
        role: req.user.role,
      });
    }
  );

  //Home
  app.post("/addHomePage", addHomePageData);

  app.get("/home", getHomePageData);

  app.put("/updateHomePage/:id", updateHomePageData);

  app.patch("/deleteHomePage/:id", deleteHomePage);

  //Register:
  app.get("/admin/getUsersById/:id", getUsersById);

  app.post("/register", upload.single("image"), registerBusinessMember);

  app.get("/admin/getRegisteredMembers", getRegisteredMembers);

  app.put(
    "/admin/updateRegisterUsers/:id",
    upload.single("image"),
    updateBusinessMember
  );

  app.patch("/admin/deleteRegisterUsers/:id", deleteBusinessMember);

  app.post("/admin/addCalenderEvent", addCalenderEvent);

  app.post("/admin/sendAlert", sendAlert);

  app.get("/admin/getAlerts", getAlerts);

  app.post("/admin/addTransactionData", addTransactionData);

  app.get("/admin/getTransactionData", getTransactionData);

  app.put("/admin/updateTransactionData/:id", updateTransactionData);

  app.patch("/admin/deleteTransactionData/:id", deleteTransactionData);

  app.post("/admin/createPayment", createPaymentIntent);

  app.get("/admin/getFundDeposit", getFundDeposit);

  app.post("/admin/fundDeposit", fundDeposit);

  app.put("/admin/updateFundDeposit/:id", updateFundDeposit);

  app.post("/admin/addFundWithdrawl", addFundWithdrawl);

  app.put("/admin/updateFundWithdrawl/:id", updateFundWithdrawl);

  app.get("/admin/getFundWithdrawl", getFundWithdrawl);

  app.put("/admin/updateIndiviual/:id", updateIndividual);

  app.get("/admin/getSellerIndividuals", getSellerIndividuals);

  app.patch("/admin/deleteSeller/:id", deleteSellerIndividuals);

  app.post("/admin/addAboutPageData", addAboutPageData);

  app.get("/admin/getAboutPageData", getAboutPageData);

  app.put("/admin/updateAboutPageData/:id", updateAboutPageData);

  app.delete("/admin/deleteAboutPageData/:id", deleteAboutPageData);

  app.get("/admin/getContactUs", getContactUs);

  app.post("/admin/addVehiclePrices", addVehiclePrices);

  app.get("/admin/getVehiclePrices", getVehiclePrices);

  app.put("/admin/updateVehiclePrices/:id", updateVehiclePrices);

  app.patch("/admin/deleteVehiclePrices/:id", deleteVehiclePrices);

  app.post("/admin/addVehicleSpecs", addVehicleSpecs);

  app.get("/admin/getVehicleSpecs", getVehiclePrices);

  app.put("/admin/updateVehicleSpecs/:id", updateVehicleSpecs);

  app.patch("/member/deleteVehicleSpecs/:id", deleteVehicleSpecs);

  app.put("/admin/updateBidStatusAdmin/:id", updateBidStatusAdmin);

  app.post("/autoUpdateToLive", autoUpdateToLive);

  app.get("/admin/upcomingAuctionsForAdmin", upcomingAuctionsForAdmin);

  app.get("/admin/liveAuctionsForAdmin", liveAuctionsForAdmin);

  app.post("/admin/addBrand", upload.single("logo"), addBrands);

  app.get("/admin/getBrands", getBrands);

  app.put("/admin/updateBrand/:id", upload.single("logo"), updateBrands); // //changes required

  app.patch("/admin/deleteBrand/:id", deleteBrand); // //changes required

  app.get("/admin/bidsPlacedById/:id", bidsPlacedById);

  app.get("/admin/getPurchasedVehicleData/:id", purchasedVehicleData);

  app.get("/checkVehicles", checkVehicles);

  app.post("/bidStartEnd", bidStartEnd);

  app.get("/admin/bidsForAdmin", bidsForAdmin);

  app.post("/addModel", addModel);

  app.get("/getModels", getModels);

  app.put("/updateModel/:id", updateModel);

  app.patch("/deleteModel/:id", deleteModel);

  app.post("/addSeries", addSeries);

  app.get("/getSeries", getSeries);

  app.get("/getSeriesById/:id", getSeriesById);

  app.put("/updateSeries/:id", updateSeries);

  app.patch("/deleteSeries/:id", deleteSereis);

  app.get("/getModelById/:id", getModelById);

  app.get("/admin/getPartner", getPartner);

  app.get("/getBrandById/:id", getBrandById);

  app.get("/admin/getSuggestions", getSuggestions);

  app.get("/admin/getPartner", getPartner);

  app.post('/addCity', addCity);
 
  app.get('/getCitites', getCitites);
 
  app.put('/updateCity/:id', updateCity);
 
  app.patch('/deleteCity/:id', deleteCity);
 
  app.get('/getCititesById/:id', getCititesById);
};
