import TaskCard from '../TaskCard';

export default function TaskCardExample() {
  return (
    <div className="max-w-2xl p-6 bg-background space-y-3">
      <TaskCard
        id="task-1"
        title="Update lab equipment maintenance records"
        description="Complete the monthly maintenance checklist for all diagnostic equipment"
        priority="high"
        status="pending"
        dueDate="2025-10-18T00:00:00"
        assignedTo={{ name: "Amit Singh" }}
        onStatusChange={(completed) => console.log('Task status:', completed)}
      />
      <TaskCard
        id="task-2"
        title="Submit quarterly reports to health department"
        priority="medium"
        status="in_progress"
        dueDate="2025-10-25T00:00:00"
        assignedTo={{ name: "Neha Verma" }}
      />
      <TaskCard
        id="task-3"
        title="Restock sample collection supplies"
        description="Order new blood collection tubes and specimen containers"
        priority="low"
        status="pending"
        dueDate="2025-10-30T00:00:00"
      />
    </div>
  );
}
