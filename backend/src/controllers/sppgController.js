const sppgModel = require('../models/sppgModel');

const getSppg = async (req, res) => {
    try {
        const data = await sppgModel.getAllSppg();
        res.json(data);
    } catch (error) {
        console.error("Error get SPPG:", error);
        res.status(500).json({ pesan: "Error server" });
    }
};
module.exports = { getSppg };