import { Response } from 'express';

export const sendCreatedResource = <T>(
  res: Response,
  key: string,
  value: T,
  extras: Record<string, unknown> = {}
): Response => {
  return res.status(201).json({
    [key]: value,
    ...extras,
  });
};

export const sendOkResource = <T>(
  res: Response,
  key: string,
  value: T,
  extras: Record<string, unknown> = {}
): Response => {
  return res.json({
    [key]: value,
    ...extras,
  });
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  totalPages: number
): Response => {
  return res.json({
    data,
    total,
    page,
    totalPages,
  });
};

export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};
