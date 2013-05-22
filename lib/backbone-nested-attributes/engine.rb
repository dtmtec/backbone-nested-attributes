module Backbone
  module NestedAttributes
    class Engine < ::Rails::Engine
      isolate_namespace Backbone::NestedAttributes
    end
  end
end
