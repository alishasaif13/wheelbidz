import express from "express";
import { upload } from "../middlewares/uploadMiddleware.js";
import { uploadVehicleImages } from "../middlewares/uploadMiddleware2.js";
import {
  authenticateToken,
  isAdmin,
  isSeller,
  isMember,
} from "../middlewares/authMiddleware.js";
import {
  addVehicle,
  getVehicles,
  updateVehicle,
  deleteVehicle,
  todayAuction,
  getVehiclesByUser,
  getVehicleFinder,
} from "../controllers/vehicleController.js";
import {
  addSalesInfo,
  getSalesInfo,
  updateSalesInfo,
  deleteSalesInfo,
} from "../controllers/salesController.js";
import {
  addCalenderEvent,
  getCalenderEvents,
  updateCalenderEvent,
  deleteCalenderEvent,
} from "../controllers/calenderController.js";
import { createBid, endBidding, updateCreateBid } from "../controllers/biddingController.js";
import {
  addLocation,
  deleteLocation,
  getLocations,
  searchLocation,
  updateLocation,
} from "../controllers/locationController.js";
import {
  addVehiclePrices,
  addVehicleSpecs,
  deleteVehiclePrices,
  deleteVehicleSpecs,
  getVehiclePrices,
  getVehicleSpecs,
  updateVehiclePrices,
  updateVehicleSpecs,
} from "../controllers/featureSpecController.js";
import {
  auctionHistory,
  getCertifiedVehicles,
  getNonCertifiedVehicles,
  getVehiclesById,
  liveAuctions,
  liveAuctionsById,
  upcomingAuctions,
} from "../controllers/bidReportingController.js";

const app = express();

export default (app) => {
  app.post("/seller/addVehicle", uploadVehicleImages, addVehicle);

  app.get("/seller/getVehicles", getVehicles); // Member, Admin

  app.put("/seller/updateVehicle/:id", uploadVehicleImages, updateVehicle);

  app.patch("/seller/deleteVehicle/:id", deleteVehicle);

  app.post("/seller/addSalesInfo/", addSalesInfo);

  app.get("/seller/getSalesInfo", getSalesInfo); //have to use in users routes

  app.put("/seller/updateSalesInfo/:id", updateSalesInfo);

  app.patch("/seller/deleteSalesInfo/:id", deleteSalesInfo);

  app.post("/seller/addCalenderEvent", addCalenderEvent); //have to use in admin routes

  app.get("/seller/getCalenderEvents", getCalenderEvents);

  app.put("seller/updateCalenderEvent/:id", updateCalenderEvent);

  app.patch("/seller/deleteCalenderEvent/:id", deleteCalenderEvent);

  app.post("/seller/createBid", createBid);

  app.put('/seller/updateCreateBid/:id', updateCreateBid);

  app.put("/seller/endBidding/:id", endBidding);

  app.post("/seller/addLocation", addLocation);

  app.put(`/seller/updateLocation/:id`, updateLocation);

  app.get("/seller/searchLocation", searchLocation);

  app.get("/seller/getLocations", getLocations);

  app.patch("/seller/deleteLocation/:id", deleteLocation);

  app.post("/seller/addVehiclePrices", addVehiclePrices);

  app.get("/seller/getVehiclePrices", getVehiclePrices);

  app.put("/seller/updateVehiclePrices/:id", updateVehiclePrices);

  app.patch("/seller/deleteVehiclePrices/:id", deleteVehiclePrices);

  app.post("/seller/addVehicleSpecs", addVehicleSpecs);

  app.get("/seller/getVehicleSpecs", getVehicleSpecs);

  app.put("/seller/updateVehicleSpecs/:id", updateVehicleSpecs);

  app.patch("/member/deleteVehicleSpecs/:id", deleteVehicleSpecs);

  app.get("/liveAuctions/:id", liveAuctions);

  app.get("/liveAuctionsById/:id", liveAuctionsById);

  app.get("/seller/upcomingAuctions/:id", upcomingAuctions);

  app.get("/seller/auctionHistory", auctionHistory);

  app.get("/seller/getCertifiedVehicles", getCertifiedVehicles);

  app.get("/seller/getNonCertifiedVehicles", getNonCertifiedVehicles);

  app.get("/getVehiclesById/:id", getVehiclesById);

  app.get("/getVehiclesByUser/:id", getVehiclesByUser);

  app.get("/todayAuction", todayAuction);

  app.get("/getVehicleFinder", getVehicleFinder);
};
