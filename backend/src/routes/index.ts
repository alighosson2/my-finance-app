import { Router } from "express";
const routes = Router();

// Basic health check route
routes.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

export default routes;