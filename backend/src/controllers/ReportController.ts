import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getCashFlowReport, getPropertyPerformance } from '../services/reportService';
import { sendOkResource } from '../http/responses';

/**
 * @swagger
 * /reports/cash-flow:
 *   get:
 *     summary: Get cash flow report for a date range
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: propertyId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Cash flow report data
 */
export const getCashFlow = async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, propertyId } = req.query;
  const report = await getCashFlowReport(req.user!, {
    startDate: startDate as string,
    endDate: endDate as string,
    propertyId: propertyId as string | undefined
  });
  return sendOkResource(res, 'report', report);
};

/**
 * @swagger
 * /reports/property/{propertyId}:
 *   get:
 *     summary: Get performance metrics for a specific property
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Property performance data
 */
export const getPropertyStats = async (req: AuthRequest, res: Response) => {
  const { propertyId } = req.params;
  const stats = await getPropertyPerformance(req.user!, propertyId as string);
  return sendOkResource(res, 'stats', stats);
};
