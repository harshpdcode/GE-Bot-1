## MEO VB1 Smart Farm System Fixes - Progress Tracker

✅ **Plan Approved** - Ready for implementation

### Phase 1: UI Text & Phone Field (user-management.html) ✓
- [x] Edit "Farmers" → "Users" (stats, filters, roles)
- [x] Add phone input to add/edit modals
- [x] Test admin page loads users correctly

### Phase 2: Login/Register Forms (login.html) ✓
- [x] Add phone input to register form
- [x] Add HTML5 pattern validation (email/password/phone)
- [x] JS validation before POST

### Phase 3: Backend Support (auth.js) ✓
- [x] POST /register: Accept/store phone
- [ ] PUT /users/:id: Update phone field (server.js handles)

### Phase 4: Validation & Utils [IN PROGRESS]
- [ ] Global validateForm() in utils.js
- [ ] Dark mode input contrast fixes

**Current: Dark mode + utils**

### Phase 3: Backend Support (auth.js)
- [ ] POST /register: Accept/store phone
- [ ] PUT /users/:id: Update phone field

### Phase 4: Validation & Utils
- [ ] Global validateForm() in utils.js
- [ ] Dark mode input contrast fixes

### Phase 5: Testing & Verification
- [ ] Start server: cd backend && node server.js
- [ ] Test Chrome: login/register/admin/dashboard
- [ ] Verify: Edit works, no disappear, dark mode OK, buttons functional
- [ ] Add test users with phone

### Phase 6: Completion
- [ ] Update TODO.md ✅ all steps
- [ ] attempt_completion

**Current Step: Editing user-management.html**

