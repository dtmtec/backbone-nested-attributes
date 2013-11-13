# -*- encoding: utf-8 -*-
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'backbone-nested-attributes/version'

Gem::Specification.new do |gem|
  gem.name          = "backbone-nested-attributes"
  gem.version       = Backbone::NestedAttributes::VERSION
  gem.authors       = ["Vicente Mundim"]
  gem.email         = ["vicente.mundim@gmail.com"]
  gem.description   = %q{Add nested attributes to your Backbone models}
  gem.summary       = %q{Add nested attributes to your Backbone models}

  gem.files         = `git ls-files`.split($/)
  gem.executables   = gem.files.grep(%r{^bin/}).map{ |f| File.basename(f) }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.require_paths = ["lib"]

  gem.add_dependency "rails", "> 3.2.8"
end
