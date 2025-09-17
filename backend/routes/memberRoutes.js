import express from "express";
import { upload } from "../middlewares/uploadMiddleware.js";
import {
  authenticateToken,
  isAdmin,
  isSeller,
  isMember,
} from "../middlewares/authMiddleware.js";
import {
  addImportedCar,
  deleteImportedCar,
  getImportedCar,
  getMake,
  getModel,
  getVehicleByMake,
  getVehicles,
  getYear,
  sortFilter,
  updateImportedCar,
} from "../controllers/vehicleController.js";
import {
  myBids,
  lotsWon,
  lotsLost,
  myOffers,
} from "../controllers/bidReportingController.js";
import { getSalesInfo } from "../controllers/salesController.js";
import {
  bidHistoryCount,
  bidStartEnds,
  endBidding,
  getUsers,
  startBidding,
  totalBidsPlaced,
  totalBuyers,
  totalLiveAuctions,
  totalSellers,
  totalUpcomingAuctions,
  totalUsers,
  totalVehicles,
  truncateData,
} from "../controllers/biddingController.js";
import { createAlert } from "../controllers/alertController.js";
import {
  sellIndividual,
  updateIndividual,
} from "../controllers/sellVehicle.js";
import {
  becomePartnerForm,
  contactFrom,
  deleteContactUs,
  giveSuggestion,
  updateContactUs,
} from "../controllers/contactUsController.js";
import {
  getVehiclePrices,
  getVehicleSpecs,
} from "../controllers/featureSpecController.js";
import { registerByEmailOTP, registerEmailVerification, verifyEmail, verifyOTP } from "../controllers/authController.js";

const app = express();

export default (app) => {
  app.get("/customer/getVehicles", getVehicles);

  app.get("/customer/getSalesInfo", getSalesInfo);

  app.get("/customer/myBids/:id", myBids);

  app.get("/customer/lotsWon", lotsWon); //this is pending

  app.get("/customer/lotsLost", lotsLost); 
 
  app.get("/customer/myOffers", myOffers);

  //start bidding
  app.post("/customer/startBidding", startBidding);

  //here alert module starts:
  app.post("/customer/createAlert", createAlert);

  app.post("/customer/sellIndividual", sellIndividual);

  app.post("/customer/contactFrom", contactFrom);

  app.put("/customer/updateContactUs/:id", updateContactUs);

  app.patch("/customer/deleteContactUs/:id", deleteContactUs);

  app.get("/customer/getVehicleByMake", getVehicleByMake);

  app.get("/customer/getVehiclePrices", getVehiclePrices);

  app.get("/customer/getVehicleSpecs", getVehicleSpecs);

  app.get("/getMake", getMake);

  app.get("/getModel", getModel);

  app.get("/sortFilter", sortFilter);

  app.get("/getYear", getYear);

  app.post("/customer/addImportedCar", addImportedCar);

  app.get("/customer/getImportedCar", getImportedCar);

  app.put("/customer/updateImportedCar/:id", updateImportedCar);

  app.patch("/customer/deleteImportedCar/:id", deleteImportedCar);

  app.get("/customer/totalVehicles", totalVehicles);

  app.get("/customer/totalLiveAuctions", totalLiveAuctions);

  app.get("/customer/totalBidsPlaced", totalBidsPlaced);

  app.get("/customer/totalUsers", totalUsers);

  app.get("/customer/totalUpcomingAuctions", totalUpcomingAuctions);

  app.get("/customer/totalSellers", totalSellers);

  app.get("/customer/bidHistoryCount", bidHistoryCount);

  app.get("/customer/totalBuyers", totalBuyers);

  app.post("/bidStartEnds", bidStartEnds);

  app.post('/customer/registerByEmailOTP', registerByEmailOTP);

  app.post('/customer/verifyOTP', verifyOTP);

  app.post('/customer/registerEmailVerification', registerEmailVerification);

  // app.post('/customer/verifyEmail', verifyEmail, (req, res) =>{
  //   res.redirect(`${process.env.FRONTEND_URL}`)
  // });

  app.post('/customer/verifyEmail/:id', verifyEmail);

  //for testing:
  app.get('/getUsers', getUsers);

  app.post('/truncateData', truncateData);

  app.post('/customer/becomePartnerForm', becomePartnerForm);

  app.post('/customer/giveSuggestion', giveSuggestion);
};