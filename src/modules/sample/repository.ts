export type SampleEntity = {
  id: number;
  name: string;
};

export class SampleRepository {
  private readonly items: SampleEntity[] = [
    { id: 1, name: "Alpha" },
    { id: 2, name: "Beta" }
  ];

  getAll(): SampleEntity[] {
    return this.items;
  }

  create(name: string): SampleEntity {
    const nextId = this.items.length + 1;
    const item = { id: nextId, name };
    this.items.push(item);
    return item;
  }
}
