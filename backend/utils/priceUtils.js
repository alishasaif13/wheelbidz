export function formatingPrice(priceInput) {
  if (!priceInput || isNaN(Number(priceInput))) {
    throw new Error("Invalid or missing price");
  }

  const newPrice = priceInput.toString();
  let finalValue = "";

  // Handle hundreds (100 - 999)
  if (newPrice.length === 3) {
    const hundreds = Math.floor(priceInput / 100);
    const remainder = priceInput % 100;

    finalValue = `${hundreds} Hundred`;
    if (remainder > 0) {
      finalValue += ` and ${remainder}`;
    }

  // Handle thousands (1000 - 9999)
  } else if (newPrice.length === 4) {
    const thousands = Math.floor(priceInput / 1000);
    const remainder = priceInput % 1000;

    finalValue = `${thousands} Thousand`;
    if (remainder > 0) {
      finalValue += ` and ${remainder}`;
    }

  // Handle ten-thousands (10000 - 99999)
  } else if (newPrice.length === 5) {
    const tenThousands = Math.floor(priceInput / 1000); // e.g. 12300 → 12
    const remainder = priceInput % 1000;                // e.g. 12300 → 300

    finalValue = `${tenThousands} Thousand`;
    if (remainder > 0) {
      finalValue += ` and ${remainder}`;
    }

  // Existing logic for Lakhs and Crores
  } else if (newPrice.length === 6) {
    const firstThree = newPrice.slice(0, 3);
    const convertedValue = (parseInt(firstThree) / 100).toFixed(2);
    finalValue = `${convertedValue} Lac`;

  } else if (newPrice.length === 7) {
    const firstFour = newPrice.slice(0, 4);
    const convertedValue = (parseInt(firstFour) / 100).toFixed(2);
    finalValue = `${convertedValue} Lac`;

  } else if (newPrice.length === 8) {
    const firstThree = newPrice.slice(0, 3);
    const convertedValue = (parseInt(firstThree) / 100).toFixed(2);
    finalValue = `${convertedValue} Crore`;

  } else if (newPrice.length === 9) {
    const firstFour = newPrice.slice(0, 4);
    const convertedValue = (parseInt(firstFour) / 100).toFixed(2);
    finalValue = `${convertedValue} Crore`;

  } else if (newPrice.length === 10) {
    const firstFive = newPrice.slice(0, 5);
    const convertedValue = (parseInt(firstFive) / 100).toFixed(2);
    finalValue = `${convertedValue} Crore`;

  } else {
    console.log("Please enter a correct amount whose range is 100 Hundred to 99 crore!");
    }

  return finalValue;
}