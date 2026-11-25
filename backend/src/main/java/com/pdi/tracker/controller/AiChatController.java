package com.pdi.tracker.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pdi.tracker.dto.AssignmentDtos.AssignmentResponse;
import com.pdi.tracker.exception.ApiException;
import com.pdi.tracker.model.Role;
import com.pdi.tracker.security.CustomUserDetails;
import com.pdi.tracker.service.AssignmentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/ai")
public class AiChatController {

    private final AssignmentService assignmentService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    public AiChatController(AssignmentService assignmentService, ObjectMapper objectMapper) {
        this.assignmentService = assignmentService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public record ChatHistoryItem(String sender, String text) {}

    public record AiChatRequest(
            @NotBlank(message = "Message is required.") String message,
            List<ChatHistoryItem> history
    ) {}

    public record AiChatResponse(String reply) {}

    @PostMapping("/chat")
    public AiChatResponse chat(
            @Valid @RequestBody AiChatRequest req,
            @AuthenticationPrincipal CustomUserDetails details
    ) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "GEMINI_API_KEY is not configured on the backend server yet."
            );
        }

        String roadmapContext = "No assigned courses yet.";
        if (details != null && details.getAccount().getRole() == Role.CANDIDATE) {
            List<AssignmentResponse> list = assignmentService.getMyAssignments(details.getAccount());
            if (!list.isEmpty()) {
                roadmapContext = list.stream()
                        .map(a -> String.format("- %s (Topic: %s, Planned: %d hrs, Status: %s, Cert: %s)",
                                a.activityTitle(),
                                a.activityTopic(),
                                a.plannedHours(),
                                a.status(),
                                a.certificateName() != null ? a.certificateName() : "None"))
                        .collect(Collectors.joining("\n"));
            }
        }

        String systemPrompt = """
                You are Gemini Live Study Coach inside the Learning Progress Tracker student portal.
                You can answer ANY question the student asks — coding, debugging, computer science concepts,
                interview prep, math, general knowledge, study plans, or questions about their personal training roadmap.
                Keep answers clear, structured, encouraging, and concise unless the user asks for deep detail.
                Note: To mark any course as Completed in this portal, students must upload a completion certificate (PDF/PNG/JPG/WEBP up to 5 MB).

                Student's Current Training Roadmap:
                """ + roadmapContext;

        try {
            var contents = new ArrayList<>();

            if (req.history() != null) {
                int start = Math.max(0, req.history().size() - 8);
                for (int i = start; i < req.history().size(); i++) {
                    ChatHistoryItem item = req.history().get(i);
                    if (item.text() == null || item.text().isBlank()) continue;
                    String role = "user".equalsIgnoreCase(item.sender()) ? "user" : "model";
                    contents.add(Map.of(
                            "role", role,
                            "parts", List.of(Map.of("text", item.text()))
                    ));
                }
            }

            contents.add(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", req.message()))
            ));

            var payload = Map.of(
                    "system_instruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
                    "contents", contents
            );

            String jsonBody = objectMapper.writeValueAsString(payload);
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="
                    + geminiApiKey.trim();

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                JsonNode errRoot = objectMapper.readTree(response.body());
                String apiMsg = errRoot.path("error").path("message").asText("Gemini API request failed.");
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Gemini error: " + apiMsg);
            }

            JsonNode root = objectMapper.readTree(response.body());
            String reply = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text")
                    .asText("I couldn't generate a response right now. Please try again.");

            return new AiChatResponse(reply.trim());
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to reach Gemini AI: " + e.getMessage());
        }
    }
}