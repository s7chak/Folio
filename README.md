# Folio

### Portfolio.Analyzed

Folio is a comprehensive mobile app designed to provide a consolidated view of your stock and ETF portfolios. It offers features for trend analysis, anomaly detection, risk/return evaluations, and various statistical metrics. The app is built with React Native on Expo, with a Python Flask backend running on Google Cloud Run, and data storage on Google Firestore.

## Features

- **Portfolio Management**: A single glass pane for managing and analyzing stock and ETF portfolios.
- **Trend Analysis**: View trends in your portfolio to make informed investment decisions.
- **Anomaly Detection**: Identify anomalies in your portfolio for risk mitigation.
- **Risk/Return**: Sharpe Analysis and plot for optimal portfolio among groups within and whole portfolio.
- **Statistical Metrics**: Access a range of statistical metrics for thorough portfolio evaluation.

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/s7chak/folio.git
   ```

2. **Navigate to the Project Directory:**

   ```bash
   cd folio
   ```

3. **Install Dependencies:**

   ```bash
   npm install
   ```

## Usage

1. **Start the Development Server:**

   ```bash
   expo start
   ```

   This will launch the app in your Expo development environment.

2. **Access the App:**

   Open the Expo client on your iOS device or use an iOS emulator to preview the app.

3. **Explore Portfolio Insights:**

   - Navigate through the intuitive UI to access various features.
   - Analyze trends, detect anomalies, and evaluate statistical metrics for your portfolios.


## Build and Deploy

To build and deploy the app to Expo for production, run the following command:

```bash
eas update --channel production
```

This will update the app on Expo with the latest changes for production.
