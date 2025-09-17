import pool from "../config/db.js";




export const addLocation = async (req, res) => {
    try {
        const {
            vehicleId,
            address,
            city,
            postalCode,
            contactPersonName,
            contactNo,
            status
        } = req.body;

        // Basic validation
        if (!vehicleId || !address || !city || !postalCode || !contactPersonName || !contactNo) {
            return res.status(400).json({ 
                error: 'Missing required fields'
            });
        }

        // Default status to 'Y' if not provided
        const locationStatus = status === 'N' ? 'N' : 'Y';

        const [insertResult] = await pool.query(
            `INSERT INTO tbl_physical_bidding_locations 
            (vehicleId, address, city, postalCode, contactPersonName, contactNo, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                vehicleId,
                address,
                city,
                postalCode,
                contactPersonName,
                contactNo,
                locationStatus
            ]
        );

        const locationId = insertResult.insertId


        const [getLocationInserted] = await pool.query(`select * from tbl_physical_bidding_locations where status='Y' and id=?`, [locationId]);

        res.status(201).json({
            ...getLocationInserted[0]
        });

    } catch (error) {
        console.error('Error adding location:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};




export const updateLocation = async (req, res) => {
    try {
        const id = req.params.id;
        const {
            vehicleId,
            address,
            city,
            postalCode,
            contactPersonName,
            contactNo,
            status
        } = req.body;

        // Validation
        if (!id || !vehicleId || !address || !city || !postalCode || !contactPersonName || !contactNo) {
            return res.status(400).json({ 
                error: 'Missing required fields'
            });
        }

        const locationStatus = status === 'N' ? 'N' : 'Y';

        // Update query
        await pool.query(
            `UPDATE tbl_physical_bidding_locations
             SET vehicleId = ?, address = ?, city = ?, postalCode = ?, contactPersonName = ?, contactNo = ?, status = ?
             WHERE id = ?`,
            [
                vehicleId,
                address,
                city,
                postalCode,
                contactPersonName,
                contactNo,
                locationStatus,
                id
            ]
        );

        // Fetch updated record (only if status is 'Y')
        const [updatedLocation] = await pool.query(
            `SELECT * FROM tbl_physical_bidding_locations WHERE status = 'Y' AND id = ?`,
            [id]
        );

        if (updatedLocation.length === 0) {
            return res.status(404).json({ 
                error: 'Location not found or not active'
            });
        }

        res.status(200).json({
            ...updatedLocation[0]
        });

    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};


  


export const searchLocation = async (req, res) => {
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        let whereClause = '';
        const searchFields = [
            'vehicleId',
            'address',
            'city',
            'postalCode',
            'contactPersonName',
            'contactNo',
            'status'
        ];

        if (search) {
            const searchConditions = searchFields.map(field => `${field} LIKE ?`).join(' OR ');
            whereClause = `WHERE ${searchConditions}`;
        }

        const searchParams = search ? Array(searchFields.length).fill(`%${search}%`) : [];

        const [locations] = await pool.query(
            `SELECT * FROM tbl_physical_bidding_locations ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
            [...searchParams, limit, offset]
        );

        // Get total matching count for pagination
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM tbl_physical_bidding_locations ${whereClause}`,
            searchParams
        );

        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        res.status(200).json(locations);

    } catch (error) {
        console.error('Error searching locations:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};






export const getLocations = async (req, res) => {
    try {
        const [getLocation]  = await pool.query(`select * from tbl_physical_bidding_locations where status='Y'`);

        res.status(200).send(getLocation);
    } catch (error) {
        console.error('Error getting locations:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}





export const deleteLocation = async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query(`update tbl_physical_bidding_locations set status='N' where id=?`, [id]);

        const [getDeleted] = await pool.query(`select * from tbl_physical_bidding_locations where id = ?`, [id]);

        res.status(200).send({...getDeleted[0]})
    } catch (error) {
        console.error('Error Deleting locations:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}