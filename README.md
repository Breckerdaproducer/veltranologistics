# Veltrano Logistics - Node.js & PostgreSQL Backend

Robust, high-performance Node.js & PostgreSQL backend service and Admin Management Portal for Veltrano Logistics.

## 🚀 Key Features

1. **Live Consignment Tracking (`/api/track/:number`)**:
   - Real-time tracking of consignments with progress calculation (15% to 100%).
   - Multi-checkpoint timeline with timestamps, locations, and status events.
   - Shipper, consignee, package type, weight, and ETA data.
   - Seamlessly integrated with `track-shipment.html`.

2. **Site-Wide Header Search (`/api/search?q=...`)**:
   - Multi-model search engine covering:
     - Active consignments & shipments (with direct tracking links).
     - Freight services (Air, Ocean, Truck, Train, Van, Drone, Wagon Freight).
     - Informational pages and blog insights.
   - Live suggestions dropdown connected to the header search input.

3. **Contact Form Inquiries (`/api/contact`)**:
   - Validates and stores incoming website inquiries into PostgreSQL.
   - Supports both JSON and WPForms payload formats from `contacts.html`.
   - Sends real-time admin alert emails and customer auto-reply confirmations.
   - Displays sleek inline alert banners (success or validation errors).

4. **Email Handling (Nodemailer)**:
   - Configurable SMTP via `.env` (Gmail, Outlook, Amazon SES, SendGrid, Hostinger, etc.).
   - Built-in safe mock logger if SMTP credentials are omitted, ensuring the API remains 100% operational during development.
   - Branded HTML templates for admin notifications, customer acknowledgments, and shipment status alerts.

5. **Veltrano Admin Portal (`http://localhost:5000/admin`)**:
   - **Authentication**: JWT token and secure HTTP-only cookies (`admin` / `AdminPassword123!`).
   - **Dashboard**: Live operational stats (Total Shipments, In Transit, Delivered, Inquiries, Unread count).
   - **Shipments Manager**: Register new shipments with auto-generated tracking numbers, edit routes, delete shipments, and print waybills.
   - **Milestone & Checkpoint Manager**: Add checkpoints to any shipment (updates current location and status automatically, with optional email alerts to customers).
   - **Contact Messages**: Read, mark as read/replied, reply via pre-filled email, and delete inquiries.

---

## 🛠️ Tech Stack & Directory

- **Runtime**: Node.js (v18+)
- **Database**: PostgreSQL (Database: `veltrano_logistics`)
- **Web Framework**: Express.js
- **Auth**: JSON Web Tokens (JWT) + bcryptjs
- **Mailing**: Nodemailer
- **Frontend Admin**: Tailwind CSS, FontAwesome 6, Vanilla JS SPA

---

## ⚙️ Environment Variables (`.env`)

```env
PORT=5000
NODE_ENV=development

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=veltrano_logistics
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=veltrano_logistics_secret_key_9824_production_grade
ADMIN_DEFAULT_USERNAME=admin
ADMIN_DEFAULT_PASSWORD=AdminPassword123!
ADMIN_EMAIL=info@veltranologistics.site

# Email / SMTP Settings
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@veltranologistics.site
SMTP_PASS="your_password"
SMTP_FROM="Veltrano Logistics Support" <info@veltranologistics.site>
ADMIN_NOTIFY_EMAIL=admin@example.com

# Allowed CORS origins
CORS_ORIGIN=*
```

---

## 🏃 Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run automated tests
npm test
```
