# UML and workflow diagrams

## Class diagram

```mermaid
classDiagram
  class Agent {
    <<abstract>>
    +name() string
    +instructions() string
    +execute(context, provider) Json
  }
  class RoleAgent { +execute(context, provider) Json }
  class PlanningAgent
  class OrchestratorAgent
  class ResearchAgent
  class KnowledgeAgent
  class FinanceAgent
  class ExecutionAgent
  class CriticAgent
  class MemoryAgent
  Agent <|-- RoleAgent
  RoleAgent <|-- PlanningAgent
  RoleAgent <|-- OrchestratorAgent
  RoleAgent <|-- ResearchAgent
  RoleAgent <|-- KnowledgeAgent
  RoleAgent <|-- FinanceAgent
  RoleAgent <|-- ExecutionAgent
  RoleAgent <|-- CriticAgent
  RoleAgent <|-- MemoryAgent
  class IntelligenceProvider {
    <<abstract>>
    +complete(instructions, context) Json
    +embed(text) vector
  }
  IntelligenceProvider <|-- DemoProvider
  IntelligenceProvider <|-- OpenAICompatibleProvider
  RoleAgent --> IntelligenceProvider
  Service *-- ExecutionPipeline
  Service *-- KnowledgeService
  Service *-- AgentCommunicationManager
  Service o-- Database
  ExecutionPipeline *-- TaskQueue
  AgentFactory --> Agent
  Repository <|-- Service
  Transaction o-- Database
```

## Use cases

```mermaid
flowchart TD
  User["Registered user"] --> Workspace["Create workspace / projects"]
  User --> Studio["Request agent proposal"]
  User --> Knowledge["Upload and search project evidence"]
  User --> Tasks["Manage tasks and milestones"]
  User --> Team["Discuss and view notifications"]
  Owner["Owner / workspace admin"] --> Review["Approve, reject, request changes"]
  Owner --> Invite["Invite members and set roles"]
  Owner --> Config["Configure agents"]
  Viewer["Viewer"] --> Read["Read project records"]
  Admin["Platform admin"] --> Inventory["View account inventory"]
```

## Proposal and approval sequence

```mermaid
sequenceDiagram
  participant H as Human
  participant A as C++ API
  participant Q as Worker pipeline
  participant M as Agent team
  participant D as Database
  H->>A: Submit goal and constraints
  A->>D: Verify membership; save run
  A->>Q: Queue bounded execution
  A-->>H: Run ID
  Q->>D: Retrieve project sources and memory
  loop Ordered specialized roles
    Q->>M: Goal + constraints + preceding outputs
    M-->>Q: Validated structured result
    Q->>D: Persist execution and shared message
  end
  Q->>D: Save proposal + pending approval
  H->>A: Poll status and inspect proposal
  A-->>H: Results, sources, errors and status
  H->>A: Approve
  A->>D: Transaction: verify pending + role
  A->>D: Insert tasks and approval decision
  A->>D: Commit
  A-->>H: Created task IDs
```

## Document ingestion sequence

```mermaid
sequenceDiagram
  participant H as Human
  participant A as C++ API
  participant K as Knowledge service
  participant P as Embedding strategy
  participant D as Database
  H->>A: Upload filename + base64 bytes
  A->>D: Authorize project membership
  A->>K: Validated upload
  K->>K: Extract UTF-8 text; chunk with overlap
  loop Each bounded chunk
    K->>P: Generate vector
    P-->>K: Vector + model identity
  end
  K->>D: Atomic document + chunk insertion
  A-->>H: Document ID and index details
```
