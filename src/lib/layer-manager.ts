import { TextEntity } from "./entity.text";
import { Layer } from "./layer";
import { LayoutManager } from "./layout-manager";
import { BaseEntityType, EntityTypes, LAYER } from "./types";

export class LayerManager extends Map<LAYER, Layer> {
  #layouts: LayoutManager;
  #shouldUpdate = true;

  constructor(layouts: LayoutManager = new LayoutManager()) {
    super();
    this.#layouts = layouts;
  }

  public getEntityById<T extends EntityTypes>(
    layer: LAYER,
    id: string
  ): T | undefined {
    return this.get(layer)?.get(id) as T | undefined;
  }

  public hasEntityById(layer: LAYER, id: string) {
    return this.get(layer)!.has(id);
  }

  public setEntity(entity: EntityTypes) {
    if (entity.type === "text") {
      this.requestUpdate();
    }
    this.get(entity.layer)!.set(entity.id, entity);
  }

  public removeEntity(layer: LAYER, id: string) {
    this.get(layer)?.delete(id);
  }

  public getEntitiesByType(type: BaseEntityType) {
    return Array.from(this.values()).flatMap((layer) => layer.getByType(type));
  }

  public resize() {
    this.requestUpdate();
    this.forEach((layer) => layer.resize());
  }

  public requestUpdate() {
    this.#shouldUpdate = true;
    this.forEach((layer) => layer.requestUpdate());
  }

  public updateLayout() {
    const textEntities = this.getEntitiesByType("text") as TextEntity[];
    this.#layouts.update(textEntities);
    this.#shouldUpdate = false;
  }

  public update() {
    this.forEach((layer) => {
      if (!layer.shouldUpdate) return;
      layer.update();
    });
  }

  public render() {
    if (this.#shouldUpdate) {
      this.updateLayout();
    }

    this.forEach((layer) => {
      if (!layer.shouldRender) return;
      layer.render();
    });
  }

  public clear() {
    this.forEach((layer) => layer.clear());
  }
}

