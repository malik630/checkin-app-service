import { Request, Response } from 'express'
import * as flightsService from './flights.service.js'

export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const flight = await flightsService.getFlightById(id)
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' })
    }
    res.json(flight)
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const getAll = async (req: Request, res: Response) => {
  try {
    const flights = await flightsService.getAllFlights()
    res.json(flights)
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
