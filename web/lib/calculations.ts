export const SUN_RADIUS_KM = 695700; // Sun radius in kilometers

export const calculateSunCircumference = (
  piValue: string,
  decimalPlaces: number
): string => {
  try {
    // Safeguard: ensure decimalPlaces is a valid number
    const safeDecimalPlaces = Math.max(0, Math.min(decimalPlaces || 0, 100));

    // Use the Pi value with precision matching the calculated decimal places
    // But limit to reasonable precision for display (max 20 decimal places)
    const displayPrecision = Math.min(safeDecimalPlaces, 20);

    const pi = parseFloat(piValue);
    if (isNaN(pi)) return "N/A";

    // Calculate circumference using the Pi value
    // JavaScript numbers have limited precision (~15-17 decimal digits)
    const circumference = 2 * pi * SUN_RADIUS_KM;

    // Format with appropriate precision (cap at 20 for toLocaleString safety)
    return circumference.toLocaleString("en-US", {
      maximumFractionDigits: displayPrecision,
      minimumFractionDigits: 0,
    });
  } catch (error) {
    console.error("Error calculating sun circumference:", error);
    return "N/A";
  }
};
