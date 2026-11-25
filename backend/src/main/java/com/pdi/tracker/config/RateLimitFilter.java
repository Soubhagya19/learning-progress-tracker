package com.pdi.tracker.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private record AttemptWindow(int count, Instant windowStart) {}
    private final Map<String, AttemptWindow> attempts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if ("/api/v1/auth/login".equals(request.getRequestURI()) && "POST".equalsIgnoreCase(request.getMethod())) {
            String ip = request.getRemoteAddr();
            Instant now = Instant.now();
            AttemptWindow window = attempts.compute(ip, (k, existing) -> {
                if (existing == null || now.isAfter(existing.windowStart().plusSeconds(60))) {
                    return new AttemptWindow(1, now);
                }
                return new AttemptWindow(existing.count() + 1, existing.windowStart());
            });

            if (window.count() > 15) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\":\"Too many login attempts. Try again shortly.\"}");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}
