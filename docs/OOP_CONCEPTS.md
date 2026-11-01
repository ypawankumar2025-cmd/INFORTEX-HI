# Meaningful C++ OOP mapping

| Concept | Implementation and reason |
|---|---|
| Classes/objects | Database, Service, KnowledgeService, each specialized agent and provider encapsulate responsibilities. |
| Encapsulation | Database handles, provider credentials and queue synchronization are private. |
| Abstraction | Agent and IntelligenceProvider define virtual contracts independent of implementation. |
| Inheritance | RoleAgent implements shared execution behavior; eight final specialized agents inherit it. Service inherits Repository. |
| Runtime polymorphism | unique_ptr<Agent> and unique_ptr<IntelligenceProvider> call virtual methods. |
| Compile-time polymorphism | TaskQueue<T> supports a typed payload; Money operators express domain arithmetic. |
| Operator overloading | Money::operator+ and operator<= preserve integer paise arithmetic. |
| Function overloading / ADL | friend to_json(Json&, const Money&) integrates the domain value with nlohmann serialization. It is an overload in the serialization customization set. |
| Constructors/destructors | Database acquires/releases native connections; ExecutionPipeline starts and joins workers. |
| Pure virtual methods | Agent::execute, name, instructions; provider complete/embed/mode contracts. |
| Virtual destructor | Agent, IntelligenceProvider and Repository support safe polymorphic destruction. |
| Static members | AgentFactory::create and AgentRegistry::ids provide construction and the immutable type catalog. |
| Composition | Service contains KnowledgeService, AgentCommunicationManager and ExecutionPipeline. |
| Aggregation | Services reference the longer-lived Database and provider without owning them. |
| Templates | TaskQueue<T> and STL containers retain type safety. |
| Exceptions | Error carries an HTTP status; provider failures are caught and persisted at the pipeline boundary. |
| RAII | Transaction rolls back unless committed; native curl/archive/statement handles use unique_ptr deleters. |
| Smart pointers | Factories transfer exclusive ownership with unique_ptr. |
| File handling | Schema loading, temporary PDF inputs/outputs and bounded document extraction. |
| STL | vector, map, set, queue, strings, sort, chrono, mutex, condition_variable. |
| Namespaces/lambdas | hi namespace; queue workers, API handlers, sorting and cleanup lambdas. |

## Patterns

- Factory: AgentFactory chooses an agent by validated registry ID.
- Strategy: IntelligenceProvider chooses deterministic or live generation/embeddings.
- Repository: Repository and Database separate row lookup and parameterized persistence from HTTP transport.
- RAII unit of work: Transaction represents an atomic business operation.
- Producer–consumer: ExecutionPipeline owns workers consuming TaskQueue callables.

The communication manager persists messages directly; it is not falsely labeled a full Observer implementation. Multiple inheritance and a mutable Singleton were deliberately not introduced because this design has no justified use for them. Dependencies are injected and lifetime-owned in main. The original brief asked that OOP constructs not be added artificially; this mapping documents what the actual source uses.

## Viva walkthrough

1. Trace `main.cpp` request → authentication → `Service::handle` → project authorization → repository call.
2. Trace `startRun` → bounded queue → `executeRun` → AgentFactory → virtual `execute` → provider.
3. Explain why vector similarity is project-filtered before scoring.
4. Explain why an approval transaction prevents duplicate task creation even when users double-click.
5. Explain why integer paise avoids binary floating-point currency errors.
6. Explain why an AI-generated plan does not grant authorization to execute external actions.
