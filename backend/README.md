# Inventory Management System - Backend API

A robust and scalable RESTful API designed for a high-performance Inventory Management System. This backend handles complex inventory logic, including barcode management, order processing, and advanced security using Policy-Based Access Control (PBAC).

## 🚀 Key Features

* **🔐 Advanced Security (PBAC):** Implements Policy-Based Access Control to manage user permissions dynamically and granularly, going beyond standard RBAC.
* **📦 Product Management:** Full CRUD operations for products with support for variants and categories.
* **🏷️ Barcode Integration:**
    * Automatic EAN-13/UPC barcode generation for individual product items.
    * Barcode scanning and validation logic.
* **🛒 Order Processing:** Streamlined workflow for regular orders, consignment tracking, and status updates.
* **⚡ High Performance:** Integrated **Redis** caching to speed up frequent data retrieval and session management.
* **🗄️ Database:** Utilizes **MongoDB** with **Mongoose** ORM for flexible and efficient data modeling.

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (via Mongoose)
* **Caching:** Redis
* **Authentication:** JWT (JSON Web Tokens) with PBAC middleware
* **Validation:** Joi / Zod (Assuming standard validation)

## ⚙️ Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/inventory-backend.git](https://github.com/engrsakib/inventory-backend.git)
    cd inventory-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory and add the following:
    ```env
    PORT=5001
    MONGO_URI=mongodb://localhost:27017/inventory_db
    REDIS_URL=redis://localhost:6379
    NODE_ENV=development
    ```

4.  **Start the server:**
    ```bash
    # Development mode
    npm run dev

    # Production mode
    npm start
    ```

🤝 Contributing
Contributions are welcome! Please fork the repository and create a pull request.