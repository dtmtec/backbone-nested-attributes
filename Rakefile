#!/usr/bin/env rake
begin
  require 'bundler/setup'
rescue LoadError
  puts 'You must `gem install bundler` and `bundle install` to run rake tasks'
end

APP_RAKEFILE = File.expand_path("../spec/dummy/Rakefile", __FILE__)
load 'rails/tasks/engine.rake'

Bundler::GemHelper.install_tasks

task :travis do
  puts "Starting to run app:jasmine:ci..."
  system("export DISPLAY=:99.0 && bundle exec rake app:jasmine:ci")
  raise "#{cmd} failed!" unless $?.exitstatus == 0
end

task :jasmine => 'app:jasmine'

task :default => :travis
