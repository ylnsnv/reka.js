import * as t from '@composite/types';
import { computed, IComputedValue, runInAction, untracked } from 'mobx';

import { Environment } from './environment';
import { createKey } from './utils';
import { TemplateEvaluateContext, ViewTree } from './view';

type ComponentViewTreeComputationCache = {
  component: t.Component;
  computed: IComputedValue<
    t.CompositeComponentView[] | t.ExternalComponentView[]
  >;
};

export class ComponentViewEvaluator {
  private declare resolveComponentComputation: IComputedValue<
    t.CompositeComponentView[] | t.ErrorSystemView[] | t.ExternalComponentView[]
  >;
  private declare componentViewTreeComputation: ComponentViewTreeComputationCache | null;

  private declare compositeComponentRootComputation: IComputedValue<t.View> | null;
  private declare compositeComponentPropsComputation: IComputedValue<void> | null;
  private declare compositeComponentStateComputation: IComputedValue<void> | null;

  private readonly tree: ViewTree;
  private readonly ctx: TemplateEvaluateContext;
  private readonly template: t.ComponentTemplate;

  private readonly env: Environment;

  readonly key: string;

  constructor(
    tree: ViewTree,
    ctx: TemplateEvaluateContext,
    template: t.ComponentTemplate,
    env: Environment
  ) {
    this.tree = tree;
    this.ctx = ctx;
    this.template = template;
    this.key = createKey(this.ctx.path);

    this.env = env;

    this.compositeComponentStateComputation = null;
  }

  private computeViewTreeForComponent(component: t.Component) {
    if (component instanceof t.ExternalComponent) {
      this.compositeComponentPropsComputation = null;
      this.compositeComponentStateComputation = null;

      return [
        t.externalComponentView({
          component,
          key: this.key,
          template: this.template,
          props: Object.keys(this.template.props).reduce(
            (accum, key) => ({
              ...accum,
              [key]: this.tree.evaluateExpr(
                this.template.props[key],
                this.ctx.env
              ),
            }),
            {}
          ),
        }),
      ];
    }

    if (component instanceof t.CompositeComponent) {
      const componentViewTree = t.compositeComponentView({
        key: this.key,
        component,
        render: [],
        template: this.template,
      });

      untracked(() => {
        this.compositeComponentRootComputation = computed(() => {
          if (!this.compositeComponentPropsComputation) {
            this.compositeComponentPropsComputation = computed(() => {
              const slot = this.template.children.flatMap((child) =>
                this.tree.computeTemplate(child, {
                  ...this.ctx,
                  path: [...this.ctx.path, child.id],
                })
              );

              this.env.set('$$children', slot);

              component.props.forEach((prop) => {
                this.env.set(
                  prop.name,
                  this.tree.evaluateExpr(
                    this.template.props[prop.name],
                    this.ctx.env
                  )
                );
              });
            });
          }

          this.compositeComponentPropsComputation.get();

          if (!this.compositeComponentStateComputation) {
            this.compositeComponentStateComputation = computed(() => {
              component.state.forEach((val) => {
                this.env.set(
                  val.name,
                  this.tree.evaluateExpr(val.init, this.env)
                );
              });
            });
          }

          this.compositeComponentStateComputation.get();

          const render = this.tree.computeTemplate(component.template, {
            path: [this.key, 'root'],
            env: this.env,
          });

          componentViewTree.render.length = render.length;

          runInAction(() => {
            for (let i = 0; i < render.length; i++) {
              if (componentViewTree.render[i] === render[i]) {
                continue;
              }

              componentViewTree.render[i] = render[i];
            }
          });

          return componentViewTree;
        });

        return this.compositeComponentRootComputation.get();
      });

      return [componentViewTree];
    }

    throw new Error('Invalid Component Template');
  }

  compute() {
    if (!this.resolveComponentComputation) {
      this.resolveComponentComputation = computed(() => {
        const component = this.env.getByName(
          this.template.component.name
        ) as t.Component;

        if (!component) {
          return [
            new t.ErrorSystemView({
              error: `Component "${this.template.component.name}" not found`,
              key: this.key,
              template: this.template,
            }),
          ];
        }

        if (
          this.componentViewTreeComputation &&
          this.componentViewTreeComputation.component === component
        ) {
          return this.componentViewTreeComputation.computed.get();
        }

        this.componentViewTreeComputation = {
          component,
          computed: computed(() => this.computeViewTreeForComponent(component)),
        };

        return this.componentViewTreeComputation.computed.get();
      });
    }

    const componentView = this.resolveComponentComputation.get();

    if (this.compositeComponentRootComputation) {
      this.compositeComponentRootComputation.get();
    }

    return componentView;
  }
}