import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import app from "../app.js";

const TEST_USER_EMAIL = "test_auth@example.com";
const TEST_USER_PASSWORD = "testpassword123";

describe("POST /api/auth/login", () => {
    const path = "/api/auth/login";

    it("should return 400 if no email is passed", async () => {
        let response = await request(app).post(path).send({
            password: TEST_USER_PASSWORD,
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Non-empty email is required");
    });

    it("should return 400 if no password is passed", async () => {
        let response = await request(app).post(path).send({
            email: TEST_USER_EMAIL,
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Non-empty password is required");
    });

    it("should return 500 for invalid login information", async () => {
        let response = await request(app).post(path).send({
            email: TEST_USER_EMAIL,
            password: "TotallyTheWrongPassword",
        });

        expect(response.status).toBe(500);
        expect(response.body.error).toBeDefined();
        expect(response.body.success).toBe(false);
    });

    it("should return 200 for a valid login attempt", async () => {
        let response = await request(app).post(path).send({
            email: TEST_USER_EMAIL,
            password: TEST_USER_PASSWORD,
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.jwt).toBeDefined();
    });
});
