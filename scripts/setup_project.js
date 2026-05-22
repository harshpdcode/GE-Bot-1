
const { initDatabase, createUser, findUserByUsername } = require('../backend/database');
const fs = require('fs');
const path = require('path');

async function setup() {
    console.log('🚀 Initializing Database...');
    initDatabase();

    console.log('👤 Creating Test Users...');
    // Default admin and user are created by seedDefaults() in database.js
    // We add one more test user to make it "2 test users and 1 admin"
    const usersToAdd = [
        { username: 'user2', password: 'user123', role: 'user', fullName: 'DynoRex Secondary Operator', email: 'user2@dynorex.io' }
    ];

    for (const u of usersToAdd) {
        if (!findUserByUsername(u.username)) {
            const res = createUser(u.username, u.password, u.role, u.fullName, u.email);
            if (res.success) {
                console.log(`  → User '${u.username}' created successfully.`);
            } else {
                console.log(`  → Failed to create user '${u.username}': ${res.error}`);
            }
        } else {
            console.log(`  → User '${u.username}' already exists.`);
        }
    }

    console.log('📄 Updating info.txt...');
    const infoPath = path.join(__dirname, '..', 'info.txt');
    let infoContent = '';
    if (fs.existsSync(infoPath)) {
        infoContent = fs.readFileSync(infoPath, 'utf8');
    }

    const credentialsSection = `
================================================================================
5. ACCESS CREDENTIALS
--------------------------------------------------------------------------------
ADMIN ACCOUNT:
   Username: admin
   Password: admin123
   Role: Admin

TEST USER 1:
   Username: user
   Password: user123
   Role: User/Farmer

TEST USER 2:
   Username: user2
   Password: user123
   Role: User/Farmer
================================================================================
`;

    // Append or replace the credentials section
    if (infoContent.includes('5. ACCESS CREDENTIALS')) {
        // Simple replacement logic if it already exists
        const before = infoContent.split('5. ACCESS CREDENTIALS')[0];
        const after = infoContent.split('================================================================================').pop();
        infoContent = before + '5. ACCESS CREDENTIALS' + credentialsSection.split('5. ACCESS CREDENTIALS')[1] + after;
    } else {
        infoContent += credentialsSection;
    }

    fs.writeFileSync(infoPath, infoContent);
    console.log('✅ setup_project.js completed successfully!');
}

try {
    setup();
} catch (err) {
    console.error('❌ Error during setup:', err);
    process.exit(1);
}
