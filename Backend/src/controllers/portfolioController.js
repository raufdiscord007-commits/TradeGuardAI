const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getUserPortfolio = async (req, res) => {
  try {
    // YOUR NEW FAKE DATA: Includes Profit, Loss, Dates, and Wallet Balance
    const dummyPortfolio = [
      { 
        id: "1", 
        name: "Bitcoin", 
        symbol: "BTC", 
        amount: 0.15, 
        currentPrice: 65430.00,
        status: "profit",
        pnl: 450.25, // Profit in USD
        date: "Yesterday, 2:30 PM"
      },
      { 
        id: "2", 
        name: "Ethereum", 
        symbol: "ETH", 
        amount: 2.50, 
        currentPrice: 3420.50,
        status: "loss",
        pnl: -85.10, // Loss in USD
        date: "Today, 10:15 AM"
      }
    ];

    const walletBalance = 350.00; // Your USD Wallet Balance

    res.status(200).json({
      success: true,
      message: "Portfolio fetched successfully",
      walletBalance: walletBalance,
      data: dummyPortfolio
    });

  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ success: false, error: "Failed to load portfolio" });
  }
};

module.exports = { getUserPortfolio };