import pool from "../config/db.js";

export const sellIndividual = async (req, res) => {
  try {
    const { userId, year, make, model, bussinessName, noOfCars, sellerType } =
      req.body;

    if (!userId || !year || !make || !model || !sellerType) {
      res.send({ message: "Please enter Required Fields!" });
      return;
    }

    const [query] = await pool.query(
      `insert into tbl_selling (userId, year, make, model, bussinessName, noOfCars, sellerType) values (?, ?, ?, ?, ?, ?, ?)`,
      [userId, year, make, model, bussinessName, noOfCars, sellerType]
    );

    const id = query.insertId;

    const [result] = await pool.query(`select * from tbl_selling where id=?`, [
      id,
    ]);

    res.status(200).send({ ...result[0] });
  } catch (error) {
    console.error(" Error adding vehicle data:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};

export const updateIndividual = async (req, res) => {
  try {
    const id = req.params.id;
    const { userId, year, make, model, bussinessName, noOfCars, sellerType } =
      req.body;

    if (!userId || !year || !make || !model || !sellerType) {
      res.send({ message: "Please enter Required Fields!" });
      return;
    }

    await pool.query(
      `update tbl_selling set userId=?, year=?, make=?, model=?, bussinessName=?, noOfCars=? sellerType=? where id=?`[
        (userId, year, make, model, bussinessName, noOfCars, sellerType)
      ]
    );

    const [result] = await pool.query(`select * from tbl_selling where id=?`, [
      id,
    ]);

    res.status(200).send({ ...result[0] });
  } catch (error) {
    console.error(" Error updating:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};

export const getSellerIndividuals = async (req, res) => {
  try {
    const [getSellers] = await pool.query(
      `select * from tbl_selling where status='Y'`
    );

    res.status(200).send(getSellers);
  } catch (error) {
    console.error(" Error getting sellers List:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};

export const deleteSellerIndividuals = async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query(`update tbl_selling set status='N' where id=?`, [id]);

    res.status(200).send({ message: "Seller Details Deleted Success!" });
  } catch (error) {
    console.error(" Error updating:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};
