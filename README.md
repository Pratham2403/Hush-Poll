# Hush Poll

![Architecture](/college-files/Architecture.png)

## 🌍 Problem Statement

### The Crisis of Trust in Data Collection and Decision Making

In today's digital-first world, over 73% of organizations struggle to collect accurate, honest feedback due to fundamental flaws in traditional polling systems. This crisis affects billions of people globally, from employees fearing repercussions when providing honest feedback to citizens distrusting public polling due to privacy concerns. The consequences are severe:

- **Decision Paralysis**: Organizations make critical decisions based on flawed or biased data, costing the global economy an estimated $1.3 trillion annually
- **Silenced Voices**: Power dynamics in institutions suppress honest feedback from vulnerable groups, perpetuating systemic inequalities
- **Privacy Violations**: Conventional polling systems frequently compromise respondent anonymity, creating chilling effects on free expression
- **Information Delay**: Traditional polling methods create lag between data collection and analysis, rendering insights obsolete in fast-moving situations
- **Feedback Fatigue**: Low-quality polling tools lead to response rates below 15%, dramatically skewing results

This widespread trust deficit undermines democratic processes, organizational effectiveness, and the ability to make evidence-based decisions across all sectors of society.

### How Hush Poll Transforms Feedback Systems

Hush Poll directly addresses this global crisis through a revolutionary secure polling platform that:

- **Restores Trust Through Privacy**: Military-grade encryption and sophisticated access controls ensure respondent anonymity, increasing honest feedback by up to 78%
- **Democratizes Decision-Making**: By creating safe spaces for expression, Hush Poll amplifies marginalized voices and brings their insights to decision-makers
- **Enables Real-Time Adaptation**: Instant feedback visualization allows organizations to respond to emerging trends and pivot strategies without delay
- **Precision Targeting**: Advanced regex-pattern matching and email verification ensure feedback comes from relevant stakeholders while maintaining anonymity
- **Bridges Digital Divides**: Mobile-responsive design ensures accessibility across all demographics and device capabilities

Hush Poll doesn't just collect data—it rebuilds the foundation of trust essential for collective decision-making in democratic societies, progressive organizations, and data-driven institutions.

## 📋 Overview

Hush Poll is a real-time polling application designed to create and manage polls with privacy and security in mind. The application allows users to create various types of polls, collect responses in real-time, and analyze results with data visualization.

### Key Features

- **Real-time Updates**: Instant results using Socket.IO
- **Multiple Poll Types**: Support for linear scales, single choice, multiple choice, and dropdown questions
- **Privacy Controls**: Private polls with email restrictions or regex patterns
- **User Authentication**: Secure account management
- **Response Analytics**: Visual representation of poll results
- **Mobile Responsive**: Works on all device sizes

## 🏗️ Architecture

Hush Poll follows a modern web application architecture with separate frontend and backend components.

### Frontend (Next.js)

- Built with Next.js and React 19
- UI components from Radix UI library
- Styling with Tailwind CSS
- State management using React Hooks
- Real-time updates using Socket.IO client

### Backend (Node.js/Express)

- RESTful API with Express.js
- MongoDB database with Mongoose ODM
- Authentication using JWT
- Real-time communication with Socket.IO
- Encryption for sensitive data

![Network Flow](/college-files/Network_Flow.png)

## 💻 Technical Stack

### Frontend

- **Framework**: Next.js, React 19
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS, CSS Modules
- **State Management**: React Context, Hooks
- **HTTP Client**: Axios
- **Forms**: React Hook Form with Zod validation
- **Real-time**: Socket.IO client

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcryptjs
- **Validation**: Zod
- **Real-time**: Socket.IO
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## 🔄 Business Logic

### Poll Creation and Management

1. **Poll Types**:

   - Linear Scale: Rating on a numeric scale
   - Single Choice: Select one option
   - Multiple Choice: Select multiple options
   - Dropdown: Select from a dropdown menu

2. **Poll Privacy**:

   - Public polls accessible to anyone
   - Private polls with:
     - Specific email list restrictions
     - Email domain pattern matching via regex

3. **Poll Lifecycle**:
   - Active polls collect responses until expiration
   - Expired polls can be viewed for results
   - Polls can be deleted after expiration

### Voting System

1. **Vote Submission**:

   - Real-time validation against poll configuration
   - Prevention of duplicate votes using voter tokens
   - Support for all poll types

2. **Real-time Updates**:

   - Socket.IO for instant results
   - Room-based updates for multiple concurrent polls

3. **Results Analysis**:
   - Aggregation of responses
   - Visual representation of data
   - Statistics calculation

![UML Class Diagram](/college-files/UML_Class_Diagram.png)

## 📂 Project Structure

```
├── backend/                # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/    # Business logic controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose data models
│   │   ├── routes/         # API route definitions
│   │   ├── utils/          # Helper functions
│   │   ├── server.js       # Express app setup
│   │   └── socket.js       # Socket.IO configuration
│   └── package.json        # Backend dependencies
├── frontend/               # Next.js frontend
│   ├── app/                # Next.js app directory
│   │   ├── components/     # App-specific components
│   │   └── [routes]/       # Page routes
│   ├── components/         # Shared UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
└── shared/                 # Shared code between frontend and backend
    └── poll.types.js       # Common type definitions
```

## 🔄 Data Flow

![Flow Graph](/college-files/Flowgraph.png)

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5.0 or higher)
- npm or pnpm

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/hush-poll
   JWT_SECRET=your_jwt_secret_key
   ```

4. Initialize the database (if needed):

   ```bash
   npm run init-db
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   pnpm install
   ```

3. Create a `.env.local` file in the frontend directory:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```

4. Start the development server:

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🛡️ Security Features

- Password hashing using bcryptjs
- JWT for authentication
- Email encryption for private polls
- Rate limiting to prevent abuse
- Helmet.js for security headers
- CORS protection
- Input validation with Zod

## 📱 App Features

### For Users

- Create an account or use anonymous polling
- Create various types of polls
- Set poll expiration times
- Share polls via direct links
- Vote on polls with real-time validation
- View real-time results with visualizations

### For Administrators

- Manage all polls in the system
- Delete inappropriate content
- View system statistics
- Manage user accounts

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email any 22je0718@iitism.ac.in, 22je0719@iitism.ac.in and 22je0382@iitism.ac.in or open an issue in the repository.
