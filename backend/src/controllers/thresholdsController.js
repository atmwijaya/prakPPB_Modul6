import { ThresholdsModel } from "../models/thresholdsModel.js";

export const ThresholdsController = {
  async list(req, res) {
    try {
      const data = await ThresholdsModel.list();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async listPaginated(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await ThresholdsModel.listPaginated(page, limit);
      res.json({
        data: result.data,
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: result.totalCount,
          totalPages: Math.ceil(result.totalCount / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async latest(req, res) {
    try {
      const data = await ThresholdsModel.latest();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const created = await ThresholdsModel.create(req.body);
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};