**Frontend Development Prompt**  
---  
**Objective**: Develop the frontend for an Anonymous Polling Web Application using React.js. Ensure adherence to the design principles, architecture, and features outlined in the BRD and SRS.  

### **Design Principles**  
1. **Responsive Design**: Ensure compatibility with desktop and mobile browsers using CSS Grid/Flexbox or a framework like Bootstrap.  
2. **User-Centric UI**: Clean, intuitive interface for seamless poll creation, voting, and result viewing.  
3. **Modular Components**: Reusable React components (e.g., `PollForm`, `VoteCard`, `ResultsChart`).  
4. **State Management**: Use React Context API for real-time poll updates and user session handling.  
5. **Accessibility**: Follow WCAG guidelines (e.g., ARIA labels, keyboard navigation).  

### **Architecture**  
- **Routing**: React Router for navigation (e.g., `/create-poll`, `/vote/:id`, `/results/:id`).  
- **Real-Time Updates**: Implement WebSocket or periodic API polling to refresh results.  
- **Local Storage**: Track anonymous votes using cookies/local storage to prevent duplicates.  

### **Features**  
1. **User Roles**:  
   - **Guest Users**:  
     - Vote in public polls via shareable links.  
     - View results (if enabled by the creator).  
   - **Registered Users**:  
     - Sign up/login via email.  
     - Create polls (single/multiple-choice, open-ended).  
     - Set expiration dates, public/private settings.  
     - Share polls via generated links.  
     - Participate in private polls (if invited).  
   - **Admin**:  
     - Access moderation dashboard (via protected route).  

2. **Poll Creation Flow**:  
   - Form to input question, options, expiration date, and privacy settings.  
   - Validation for required fields (e.g., question, at least two options).  
   - Generate and display shareable links post-creation.  

3. **Poll Participation**:  
   - Display poll options with radio buttons (single-choice) or checkboxes (multiple-choice).  
   - Submit button to cast votes.  
   - Error handling for duplicate votes (e.g., "You’ve already voted!").  

4. **Results Display**:  
   - Real-time bar charts/pie charts (using Chart.js or D3.js).  
   - Show vote counts, percentages, and total votes.  
   - Message for polls with no votes.  

5. **Responsive Layout**:  
   - Optimize UI for all screen sizes (e.g., collapsible menus on mobile).  

### **Non-Functional Requirements**  
- **Performance**: Handle 1000+ concurrent users with lazy loading and efficient state updates.  
- **Security**: Prevent XSS attacks by sanitizing user inputs.  
- **Usability**: Ensure a learning curve of <5 minutes for new users.  

---

**Backend Development Prompt**  
---  
**Objective**: Build the backend for an Anonymous Polling Web Application using Node.js, Express.js, and MongoDB. 

### **Design & Architecture**  
- **REST API**: Stateless architecture with JWT authentication for registered users/admins.  
- **Tech Stack**: Node.js, Express.js, MongoDB (Mongoose ODM).  
- **Real-Time Support**: WebSocket (Socket.io) for instant result updates.  
- **Security**: HTTPS, data encryption (AES-256), and rate limiting.  

### **Database Schema**  
1. **Users Collection**:  
   ```json  
   {  
     _id: ObjectId,  
     email: String (unique),  
     password: String (hashed),  
     role: ["admin", "user"],  
     createdPolls: [ObjectId]  
   }  
   ```  

2. **Polls Collection**:  
   ```json  
   {  
     _id: ObjectId,  
     creator: ObjectId (ref: Users, optional for guest-created polls),  
     question: String,  
     options: [String],  
     type: ["single", "multiple", "open"],  
     expiration: Date,  
     isPublic: Boolean,  
     inviteCodes: [String] (for private polls)  
   }  
   ```  

3. **Votes Collection**:  
   ```json  
   {  
     _id: ObjectId,  
     pollId: ObjectId (ref: Polls),  
     selectedOptions: [String],  
     voterToken: String (hashed cookie/local storage token),  
     timestamp: Date  
   }  
   ```  

### **Features**  
1. **Poll Management**:  
   - **Create Poll**: Validate inputs, generate unique invite codes for private polls.  
   - **Expiration Check**: Cron job to close expired polls.  

2. **Vote Handling**:  
   - Prevent duplicates using hashed `voterToken` (stored client-side).  
   - Anonymous storage (no user identity linked to votes).  

3. **Real-Time Results**:  
   - WebSocket emits updates to frontend upon new votes.  
   - Aggregate votes using MongoDB’s aggregation pipeline.  

4. **Admin APIs**:  
   - GET `/admin/polls`: Fetch all polls for moderation.  
   - DELETE `/admin/polls/:id`: Remove inappropriate polls.  
   - PATCH `/admin/users/:id`: Suspend users.  

5. **Security**:  
   - GDPR compliance: Anonymize votes and allow data deletion requests.  
   - Rate limiting (e.g., 100 votes/hour per IP).  

### **Endpoints**  
- `POST /api/polls`: Create a poll (authenticated users).  
- `GET /api/polls/:id`: Fetch poll details.  
- `POST /api/polls/:id/vote`: Submit a vote (check `voterToken`).  
- `GET /api/polls/:id/results`: Retrieve real-time results.  
- `POST /api/auth/login`: User login.  

### **Non-Functional Requirements**  
- **Performance**: 2-second response time under 1000 concurrent users.  
- **Uptime**: 99.9% availability with load balancing.  
- **Scalability**: Use MongoDB sharding for large-scale polls.  

---  
**Note**: include GDPR compliance, real-time updates, and anonymous voting mechanics.