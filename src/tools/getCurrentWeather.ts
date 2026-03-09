import { tool } from 'ai'
import { z } from 'zod/v4'

export const getCurrentWeather  = tool({
    description: "Call this tool when you need to fetch real time weather of any city",
    inputSchema: z.object({ city: z.string().describe("This is a city name Example:NewYork , London") }),
    execute: async ({ city }) => {
        try {
            const res = await fetch(`https://wttr.in/${city}?format=j1`);
            const data = await res.json();
            const current = data.current_condition[0];
            return {
                city,
                temperature: current.temp_C,
                condition: current.weatherDesc[0].value,
                humidity: current.humidity
            };
        } catch {
            return { city, error: "Failed to fetch weather" };
        }
    }

})