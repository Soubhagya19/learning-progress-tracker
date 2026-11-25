package com.pdi.tracker;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=", "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
@AutoConfigureMockMvc
class TrackerWorkflowTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private MockHttpSession loginAs(String email, String password) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) res.getRequest().getSession(false);
    }

    @Test
    void fullCandidateOnboardingAndSecurityBoundaryWorkflow() throws Exception {
        MockHttpSession coordSession = loginAs("coordinator@pdi-cohort.example", "CoordPass123!");

        MvcResult createRes = mockMvc.perform(post("/api/v1/learners")
                .session(coordSession).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Alex Rivera\",\"email\":\"alex.rivera@example.test\",\"cohort\":\"Cohort Beta\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andReturn();

        JsonNode createdJson = objectMapper.readTree(createRes.getResponse().getContentAsString());
        long learnerId = createdJson.get("learnerId").asLong();
        String tempPass = createdJson.get("temporaryPassword").asText();

        mockMvc.perform(post("/api/v1/learners")
                .session(coordSession).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Alex Clone\",\"email\":\"ALEX.RIVERA@EXAMPLE.TEST\",\"cohort\":\"Cohort Beta\"}"))
                .andExpect(status().isConflict());

        MvcResult assignRes = mockMvc.perform(post("/api/v1/assignments")
                .session(coordSession).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"learnerId\":" + learnerId + ",\"activityId\":1}"))
                .andExpect(status().isCreated())
                .andReturn();
        long assignmentId = objectMapper.readTree(assignRes.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/v1/assignments")
                .session(coordSession).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"learnerId\":" + learnerId + ",\"activityId\":1}"))
                .andExpect(status().isConflict());

        MockHttpSession candSession = loginAs("alex.rivera@example.test", tempPass);

        mockMvc.perform(get("/api/v1/me/assignments").session(candSession))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/auth/change-password")
                .session(candSession).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"" + tempPass + "\",\"newPassword\":\"NewSecurePass99!\"}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/me/assignments").session(candSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].activityTitle").value("React Basics"));

        mockMvc.perform(patch("/api/v1/assignments/" + assignmentId + "/status")
                .session(candSession).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"Completed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Completed"));

        mockMvc.perform(get("/api/v1/learners").session(candSession))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/v1/assignments/1/status")
                .session(candSession).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"Completed\"}"))
                .andExpect(status().isForbidden());
    }
}