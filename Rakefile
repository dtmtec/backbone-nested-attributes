#!/usr/bin/env rake
begin
  require 'bundler/setup'
rescue LoadError
  puts 'You must `gem install bundler` and `bundle install` to run rake tasks'
end

APP_RAKEFILE = File.expand_path("../spec/dummy/Rakefile", __FILE__)
load 'rails/tasks/engine.rake'

Bundler::GemHelper.install_tasks

task :build_js do
  require 'sprockets'

  Sprockets::Environment.new do |environment|
    environment.append_path "app/assets/javascripts"

    environment['backbone-nested-attributes/all'].write_to "backbone-nested-attributes.js"
  end
end

task :travis do
  puts "Starting to run app:jasmine:ci..."
  system("export DISPLAY=:99.0 && bundle exec rake app:jasmine:ci")
  raise "#{cmd} failed!" unless $?.exitstatus == 0
end

task :release => :build_js

task :jasmine => 'app:jasmine'

task :default => :travis
