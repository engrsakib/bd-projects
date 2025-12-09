# Inventory Management System - Frontend Client

A modern, responsive, and high-performance user interface for the Inventory Management System, built with **Next.js**. This client allows administrators and staff to manage stock, scan barcodes, and process orders efficiently.

## 🚀 Key Features

* **⚡ Next.js Framework:** Utilizes Server-Side Rendering (SSR) and Static Site Generation (SSG) for fast load times and SEO.
* **🛡️ Secure Authentication:** Integrated logic to handle login and protect routes based on PBAC policies received from the backend.
* **🏷️ Barcode Operations:**
    * Interface for viewing and printing product barcodes.
    * Input fields optimized for barcode scanners.
* **📊 Dashboard & Reporting:** Visual representation of stock levels, sales summary, and order statuses.
* **🛒 Order Management UI:** User-friendly forms for creating and managing regular orders.
* **📱 Responsive Design:** Optimized for desktops, tablets, and mobile devices.

## 🛠️ Tech Stack

* **Framework:** Next.js (React)
* **Language:** TypeScript / JavaScript
* **Styling:** Tailwind CSS / CSS Modules
* **State Management:** Redux / Context API / Zustand
* **Data Fetching:** Axios / SWR / TanStack Query

## ⚙️ Installation & Setup

1.  **Navigate to the client directory:**
    ```bash
    cd inventory-client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Deployment

This project is optimized for deployment on Vercel or any Node.js hosting service.

1.  Build the project:
    ```bash
    npm run build
    ```

2.  Start the production server:
    ```bash
    npm start
    ```

## 🤝 Contributing

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.