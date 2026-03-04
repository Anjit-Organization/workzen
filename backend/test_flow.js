const http = require('http');

const request = (options, postData) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ statusCode: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (postData) {
            req.write(JSON.stringify(postData));
        }

        req.end();
    });
};

async function testFlow() {
    try {
        console.log("=== Testing Authentication and Employee Flow ===");

        // 1. Login as Admin
        console.log("1. Logging in as Admin...");
        const adminLoginRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: 'admin@hrms.com',
            password: 'Admin@123'
        });

        if (adminLoginRes.statusCode !== 200 || !adminLoginRes.data.access_token) {
            throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
        }

        const adminToken = adminLoginRes.data.access_token;
        console.log("✅ Admin login successful");

        // 2. Create an Employee
        console.log("\n2. Creating a new Employee...");
        const newEmpEmail = `testemp_${Date.now()}@hrms.com`;
        const createEmpRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/employees',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            }
        }, {
            name: "John Doe",
            email: newEmpEmail,
            phone: "1234567890",
            department: "Engineering",
            designation: "Developer",
            joiningDate: new Date().toISOString()
        });

        if (createEmpRes.statusCode !== 201) {
            throw new Error(`Employee creation failed: ${JSON.stringify(createEmpRes.data)}`);
        }

        console.log("✅ Employee created successfully");

        // 3. Login as the new Employee
        console.log("\n3. Logging in as the newly created Employee...");
        const empLoginRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: newEmpEmail,
            password: 'Welcome@123'
        });

        if (empLoginRes.statusCode !== 200 || !empLoginRes.data.access_token) {
            throw new Error(`Employee login failed: ${JSON.stringify(empLoginRes.data)}`);
        }

        console.log("✅ Employee login successful!");
        console.log(`\nEmployee Details received: ${JSON.stringify(empLoginRes.data.user)}`);

    } catch (e) {
        console.error("❌ Test Failed:", e.message);
    }
}

testFlow();
