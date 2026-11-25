package com.pdi.tracker.model;

import jakarta.persistence.*;

@Entity
@Table(
    name = "assignments",
    uniqueConstraints = @UniqueConstraint(columnNames = {"learner_id", "activity_id"})
)
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status = AssignmentStatus.NOT_STARTED;

    @Column(name = "certificate_name", length = 255)
    private String certificateName;

    @Lob
    @Column(name = "certificate_data", columnDefinition = "TEXT")
    private String certificateData;

    public Long getId() { return id; }
    public Learner getLearner() { return learner; }
    public void setLearner(Learner learner) { this.learner = learner; }
    public Activity getActivity() { return activity; }
    public void setActivity(Activity activity) { this.activity = activity; }
    public AssignmentStatus getStatus() { return status; }
    public void setStatus(AssignmentStatus status) { this.status = status; }
    public String getCertificateName() { return certificateName; }
    public void setCertificateName(String certificateName) { this.certificateName = certificateName; }
    public String getCertificateData() { return certificateData; }
    public void setCertificateData(String certificateData) { this.certificateData = certificateData; }
}