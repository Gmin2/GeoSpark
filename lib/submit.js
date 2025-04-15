/**
 * Submit a measurement to the Checker Network
 * @param {object} measurement The measurement data
 * @returns {Promise<boolean>} Success status
 */
export const submitMeasurement = async (measurement) => {
    try {
      console.log('Submitting measurement to Checker Network:', measurement)
      
      // Determine if the retrieval was successful
      const retrievalSucceeded = measurement.success
      
      // const payload = { retrievalSucceeded }
      const payload = { 
        retrievalSucceeded,
        location: measurement.location, 
        minerId: measurement.minerId,
        latency: measurement.latency ? Math.round(measurement.latency) : null,
        ttfb: measurement.ttfb ? Math.round(measurement.ttfb) : null,
        throughput: measurement.throughput ? Math.round(measurement.throughput) : null
      }
      
      const response = await fetch('http://localhost:8080/geo-filecoin/measurement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to submit measurement: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Measurement submitted successfully:', result)
      
      return true
    } catch (error) {
      console.error('Error submitting measurement:', error)
      return false
    }
  }
  
  /**
   * Submit multiple measurements
   * @param {Array} measurements Array of measurement objects
   * @returns {Promise<number>} Number of successfully submitted measurements
   */
  export const submitBatchMeasurements = async (measurements) => {
    try {
      console.log(`Submitting batch of ${measurements.length} measurements`)
      
      let successCount = 0
      
      // Process each measurement
      for (const measurement of measurements) {
        const success = await submitMeasurement(measurement)
        if (success) successCount++
      }
      
      console.log(`Successfully submitted ${successCount}/${measurements.length} measurements`)
      return successCount
    } catch (error) {
      console.error('Error in submitBatchMeasurements:', error)
      return 0
    }
  }