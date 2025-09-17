import pool from "../config/db.js";

export const addVehiclePrices = async(req, res) => {
    try {
        const {
            vehicleId,
            exFactoryPrice,
            withholdingTaxFiler,
            withholdingTaxNonFiler,
            payorderPriceFiler,
            payorderPriceNonFiler,
            tokenTax,
            incomeTaxFiler,
            registrationFee,
            registrationBook,
            scanningArchivingFee,
            stickerFee,
            numberPlateCharges,
            totalPriceFiler,
            totalPriceNonFiler
        } = req.body;

        // Validate required fields
        if (!vehicleId || !exFactoryPrice || !withholdingTaxFiler || !withholdingTaxNonFiler ||
            !payorderPriceFiler || !payorderPriceNonFiler || !tokenTax || !incomeTaxFiler ||
            !registrationFee || !registrationBook || !scanningArchivingFee || !stickerFee ||
            !numberPlateCharges || !totalPriceFiler || !totalPriceNonFiler) {
            return res.status(400).json({ message: "All fields are required" });
        }

const [query] = await pool.query(`
  INSERT INTO tbl_vehicle_prices (
    vehicleId,
    exFactoryPrice,
    withholdingTaxFiler,
    withholdingTaxNonFiler,
    payorderPriceFiler,
    payorderPriceNonFiler,
    tokenTax,
    incomeTaxFiler,
    registrationFee,
    registrationBook,
    scanningArchivingFee,
    stickerFee,
    numberPlateCharges,
    totalPriceFiler,
    totalPriceNonFiler
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [
  vehicleId,
  exFactoryPrice,
  withholdingTaxFiler,
  withholdingTaxNonFiler,
  payorderPriceFiler,
  payorderPriceNonFiler,
  tokenTax,
  incomeTaxFiler,
  registrationFee,
  registrationBook,
  scanningArchivingFee,
  stickerFee,
  numberPlateCharges,
  totalPriceFiler,
  totalPriceNonFiler
]);

    const id = query.insertId;
    const [result] = await pool.query(`select * from tbl_vehicle_prices where id = ?`, [id]);
    res.status(201).json({...result[0]});

    } catch (error) {
        console.error("Error in getFeatureSpec:", error);
        res.status(500).json({ message: "Internal Server Error" });
        
    }
}





export const getVehiclePrices = async (req, res) => {
    try {
        const { vehicleId } = req.query;
        
        if (!vehicleId) {
            return res.status(200).json(null);
        }

        const [result] = await pool.query(
            `SELECT * FROM tbl_vehicle_prices 
             WHERE vehicleId = ? AND status = 'Y'`, 
            [vehicleId]
        );

        res.status(200).json(result[0] || null);
    } catch (error) {
        res.status(200).json(null);
    }
}




export const updateVehiclePrices = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vehicleId,
      exFactoryPrice,
      withholdingTaxFiler,
      withholdingTaxNonFiler,
      payorderPriceFiler,
      payorderPriceNonFiler,
      tokenTax,
      incomeTaxFiler,
      registrationFee,
      registrationBook,
      scanningArchivingFee,
      stickerFee,
      numberPlateCharges,
      totalPriceFiler,
      totalPriceNonFiler
    } = req.body;

    // Validate required fields
    if (
      !vehicleId || !exFactoryPrice || !withholdingTaxFiler || !withholdingTaxNonFiler ||
      !payorderPriceFiler || !payorderPriceNonFiler || !tokenTax || !incomeTaxFiler ||
      !registrationFee || !registrationBook || !scanningArchivingFee || !stickerFee ||
      !numberPlateCharges || !totalPriceFiler || !totalPriceNonFiler
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [query] = await pool.query(`
      UPDATE tbl_vehicle_prices SET
        vehicleId = ?,
        exFactoryPrice = ?,
        withholdingTaxFiler = ?,
        withholdingTaxNonFiler = ?,
        payorderPriceFiler = ?,
        payorderPriceNonFiler = ?,
        tokenTax = ?,
        incomeTaxFiler = ?,
        registrationFee = ?,
        registrationBook = ?,
        scanningArchivingFee = ?,
        stickerFee = ?,
        numberPlateCharges = ?,
        totalPriceFiler = ?,
        totalPriceNonFiler = ?
      WHERE id = ?
    `, [
      vehicleId,
      exFactoryPrice,
      withholdingTaxFiler,
      withholdingTaxNonFiler,
      payorderPriceFiler,
      payorderPriceNonFiler,
      tokenTax,
      incomeTaxFiler,
      registrationFee,
      registrationBook,
      scanningArchivingFee,
      stickerFee,
      numberPlateCharges,
      totalPriceFiler,
      totalPriceNonFiler,
      id
    ]);

    const [updatedResult] = await pool.query(`SELECT * FROM tbl_vehicle_prices WHERE id = ?`, [id]);

    if (updatedResult.length === 0) {
      return res.status(404).json({ message: "Vehicle price not found" });
    }

    res.status(200).json({ ...updatedResult[0] });

  } catch (error) {
    console.error("Error in updateVehiclePrices:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};





export const deleteVehiclePrices = async(req, res) => {
    try {
        const { id } = req.params;

        const [query] = await pool.query(`UPDATE tbl_vehicle_prices SET status = 'N' WHERE id = ?`, [id]);

        if (query.affectedRows === 0) {
            return res.status(404).json({ message: "Vehicle price not found" });
        }

        res.status(200).json({ message: "Vehicle price deleted successfully" });
    } catch (error) {
        console.error("Error in deleteVehiclePrices:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}






// Vehicle Specs Controller
export const addVehicleSpecs = async (req, res) => {
    try {
        const {
            vehicleId,
            engineType,
            turboCharger,
            displacement,
            numberOfCylinders,
            driveTrain,
            cylinderConfiguration,
            horsePower,
            compressionRatio,
            torque,
            valvesPerCylinder,
            fuelSystem,
            valveMechanism,
            maxSpeed,
            transmissionType,
            gearbox,
            steeringType,
            minTurningRadius,
            powerAssisted,
            frontSuspension,
            rearSuspension,
            frontBrakes,
            rearBrakes,
            wheelType,
            tyreSize,
            wheelSize,
            spareTyre,
            pcd,
            spareTyreSize,
            mileageCity,
            mileageHighway,
            fuelTankCapacity
        } = req.body;
        // Validate required fields
        if (!vehicleId || !engineType || !turboCharger || !displacement || !numberOfCylinders ||
            !driveTrain || !cylinderConfiguration || !horsePower || !compressionRatio ||
            !torque || !valvesPerCylinder || !fuelSystem || !valveMechanism || !maxSpeed ||
            !transmissionType || !gearbox || !steeringType || !minTurningRadius ||
            !powerAssisted || !frontSuspension || !rearSuspension || !frontBrakes ||
            !rearBrakes || !wheelType || !tyreSize || !wheelSize || !spareTyre ||
            !pcd || !spareTyreSize || !mileageCity || !mileageHighway ||
            !fuelTankCapacity) {
            return res.status(400).json({ message: "All fields are required" });
        };

       const [query] = await pool.query(`
  INSERT INTO tbl_vehicle_specifications (
    vehicleId,
    engineType,
    turboCharger,
    displacement,
    numberOfCylinders,
    driveTrain,
    cylinderConfiguration,
    horsePower,
    compressionRatio,
    torque,
    valvesPerCylinder,
    fuelSystem,
    valveMechanism,
    maxSpeed,
    transmissionType,
    gearbox,
    steeringType,
    minTurningRadius,
    powerAssisted,
    frontSuspension,
    rearSuspension,
    frontBrakes,
    rearBrakes,
    wheelType,
    tyreSize,
    wheelSize,
    spareTyre,
    pcd,
    spareTyreSize,
    mileageCity,
    mileageHighway,
    fuelTankCapacity
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [
  vehicleId,
  engineType,
  turboCharger,
  displacement,
  numberOfCylinders,
  driveTrain,
  cylinderConfiguration,
  horsePower,
  compressionRatio,
  torque,
  valvesPerCylinder,
  fuelSystem,
  valveMechanism,
  maxSpeed,
  transmissionType,
  gearbox,
  steeringType,
  minTurningRadius,
  powerAssisted,
  frontSuspension,
  rearSuspension,
  frontBrakes,
  rearBrakes,
  wheelType,
  tyreSize,
  wheelSize,
  spareTyre,
  pcd,
  spareTyreSize,
  mileageCity,
  mileageHighway,
  fuelTankCapacity
]);
        const id = query.insertId;
        const [result] = await pool.query(`SELECT * FROM tbl_vehicle_specifications WHERE id = ?`, [id]);
        res.status(201).json({ ...result[0] });
    } catch (error) {
        console.error("Error in Adding Vehicle Specs:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}





export const getVehicleSpecs = async (req, res) => {
    try {
        const { vehicleId } = req.query;
        
        if (!vehicleId) {
            return res.status(200).json(null); // Return null instead of error
        }

        const [result] = await pool.query(
            `SELECT * FROM tbl_vehicle_specifications 
             WHERE vehicleId = ? AND status = 'Y'`, 
            [vehicleId]
        );

        res.status(200).json(result[0] || null); // Return null if no data
    } catch (error) {
        res.status(200).json(null); // Fail silently for frontend
    }
}



export const updateVehicleSpecs = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vehicleId,
      engineType,
      turboCharger,
      displacement,
      numberOfCylinders,
      driveTrain,
      cylinderConfiguration,
      horsePower,
      compressionRatio,
      torque,
      valvesPerCylinder,
      fuelSystem,
      valveMechanism,
      maxSpeed,
      transmissionType,
      gearbox,
      steeringType,
      minTurningRadius,
      powerAssisted,
      frontSuspension,
      rearSuspension,
      frontBrakes,
      rearBrakes,
      wheelType,
      tyreSize,
      wheelSize,
      spareTyre,
      pcd,
      spareTyreSize,
      mileageCity,
      mileageHighway,
      fuelTankCapacity
    } = req.body;

    // Validate required fields
    const requiredFields = [
      vehicleId, engineType, turboCharger, displacement, numberOfCylinders,
      driveTrain, cylinderConfiguration, horsePower, compressionRatio, torque,
      valvesPerCylinder, fuelSystem, valveMechanism, maxSpeed, transmissionType,
      gearbox, steeringType, minTurningRadius, powerAssisted, frontSuspension,
      rearSuspension, frontBrakes, rearBrakes, wheelType, tyreSize, wheelSize,
      spareTyre, pcd, spareTyreSize, mileageCity, mileageHighway, fuelTankCapacity
    ];

    if (requiredFields.includes(undefined) || requiredFields.includes(null)) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await pool.query(`
      UPDATE tbl_vehicle_specifications SET
        vehicleId = ?,
        engineType = ?,
        turboCharger = ?,
        displacement = ?,
        numberOfCylinders = ?,
        driveTrain = ?,
        cylinderConfiguration = ?,
        horsePower = ?,
        compressionRatio = ?,
        torque = ?,
        valvesPerCylinder = ?,
        fuelSystem = ?,
        valveMechanism = ?,
        maxSpeed = ?,
        transmissionType = ?,
        gearbox = ?,
        steeringType = ?,
        minTurningRadius = ?,
        powerAssisted = ?,
        frontSuspension = ?,
        rearSuspension = ?,
        frontBrakes = ?,
        rearBrakes = ?,
        wheelType = ?,
        tyreSize = ?,
        wheelSize = ?,
        spareTyre = ?,
        pcd = ?,
        spareTyreSize = ?,
        mileageCity = ?,
        mileageHighway = ?,
        fuelTankCapacity = ?
      WHERE id = ?
    `, [
      vehicleId, engineType, turboCharger, displacement, numberOfCylinders,
      driveTrain, cylinderConfiguration, horsePower, compressionRatio, torque,
      valvesPerCylinder, fuelSystem, valveMechanism, maxSpeed, transmissionType,
      gearbox, steeringType, minTurningRadius, powerAssisted, frontSuspension,
      rearSuspension, frontBrakes, rearBrakes, wheelType, tyreSize, wheelSize,
      spareTyre, pcd, spareTyreSize, mileageCity, mileageHighway, fuelTankCapacity,
      id
    ]);

    const [updated] = await pool.query(`SELECT * FROM tbl_vehicle_specifications WHERE id = ?`, [id]);

    if (updated.length === 0) {
      return res.status(404).json({ message: "Vehicle specification not found" });
    }

    res.status(200).json(updated[0]);

  } catch (error) {
    console.error("Error updating vehicle specifications:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};





export const deleteVehicleSpecs = async (req, res) => {
    try {
        const { id } = req.params;
        const [query] = await pool.query(`UPDATE tbl_vehicle_specifications SET status = 'N' WHERE id = ?`, [id]);
        if (query.affectedRows === 0) {
            return res.status(404).json({ message: "Vehicle specification not found" });
        }
        res.status(200).json({ message: "Vehicle specification deleted successfully" });
    } catch (error) {
        console.error("Error in deleteVehicleSpecs:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
        
    }
}    






export const addVehicleFeatures = async (req, res) => {
    try {
        //the first part:
        const { 
                safAirbags,
                safAutoDoorLock,
                safSeatbelts,
                safAntiTheft,
                safDriverBeltWarn,
                safDownhillAssist,
                safPassengerBeltWarn,
                safHillStartAssist,
                safImmobilizer,
                safTractionControl,
                safDoorOpenWarn,
                safVehicleStability,
                safChildLock,
                safRearFogLamp,
                safIsofix,
                safAeb,
                safHighMountStop,
                safBlindSpotDetect,
                safAbs,
                safLdws,
                safEbd,
                safLkas,
                safBrakeAssist} = req.body;
                
        // Validate required fields
        const requiredFields = [
            safAirbags, safAutoDoorLock, safSeatbelts, safAntiTheft, safDriverBeltWarn,
            safDownhillAssist, safPassengerBeltWarn, safHillStartAssist, safImmobilizer,
            safTractionControl, safDoorOpenWarn, safVehicleStability, safChildLock,
            safRearFogLamp, safIsofix, safAeb, safHighMountStop, safBlindSpotDetect,
            safAbs, safLdws, safEbd, safLkas, safBrakeAssist
        ];

        if (requiredFields.includes(undefined) || requiredFields.includes(null)) {
            return res.status(400).json({ message: "All fields are required" });    
        }

        
        } catch (error) {
        console.error("Error in addVehicleFeatures:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
        
    }
}